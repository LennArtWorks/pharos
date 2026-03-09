import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { Hocuspocus } from '@hocuspocus/server';
import { TiptapTransformer } from '@hocuspocus/transformer';
import { handler } from './build/handler.js';
import * as Y from 'yjs';

// Headless Tiptap Extensions
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Heading } from '@tiptap/extension-heading';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';

const serverExtensions = [
  Document, Paragraph, Text, Bold, Italic, Strike,
  Underline, Link, Heading, BulletList, OrderedList,
  ListItem, Blockquote, Code, CodeBlock
];

import db from './src/lib/server/db.ts';
import { readJsonDocument, writeJsonDocument } from './src/lib/server/cloud/filetypes/json.ts';
import { getCloudClient } from './src/lib/server/cloud/origin/client.ts';
import { getMetaCache } from './src/lib/server/cache.ts';
import { decrypt } from './src/lib/server/auth/crypto.ts';
import { getFileConfig, buildNodeFilename } from './src/lib/utils/filesystem.ts'; // NEW IMPORT

const PORT = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);

// UPDATED: Now uses the centralized buildNodeFilename utility
function buildCloudPath(nodes, targetId) {
  let currentId = targetId;
  let current = nodes[currentId];
  if (!current) return null;

  let pathSegments = [];

  while (currentId && nodes[currentId]) {
    const node = nodes[currentId];
    const physicalName = buildNodeFilename(currentId, node.extension, {
      isSecure: node.isSecure,
      isTemplate: node.isTemplate
    });
    pathSegments.unshift(physicalName);
    currentId = node.parentId;
  }

  return `/${pathSegments.join('/')}`.replace(/\/+/g, '/');
}

const hocuspocusServer = new Hocuspocus({
  name: 'FSR-OS-Server',
  debounce: 2000,

  async onConnect(data) {
    const host = data.request.headers.host || '';
    const subdomain = host.split('.')[0];
    return { subdomain };
  },

  async onLoadDocument(data) {
    const { subdomain } = data.context;
    const fileId = data.documentName;

    try {
      const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain);
      if (!org) throw new Error("Organisation not found");

      const meta = getMetaCache(org.organisation_id) || getMetaCache(subdomain);
      const node = meta?.nodes?.[fileId];

      if (!node) throw new Error("File not found in RAM cache index");

      const config = getFileConfig(node.extension);
      if (!config.websocket) return data.document;

      org.decrypted_password = decrypt(org.cloud_password_encrypted);

      const fullPath = buildCloudPath(meta.nodes, fileId);
      console.log(`[Persistence] Loading Sciebo Path: ${fullPath}`);

      const client = await getCloudClient(org);
      const remoteJson = await readJsonDocument(client, fullPath);

      if (!remoteJson) return data.document;

      const isEmpty = data.document.getXmlFragment('default').firstChild === null;

      if (isEmpty) {
        if (remoteJson.documentState) {
          // NEW: Apply pure mathematical Yjs history from Base64
          const update = Buffer.from(remoteJson.documentState, 'base64');
          Y.applyUpdate(data.document, update);
        } else {
          // Fallback for older JSON-only files
          const jsonPayload = remoteJson.content || remoteJson;
          const tempDoc = TiptapTransformer.toYdoc(jsonPayload, 'default', serverExtensions);
          Y.applyUpdate(data.document, Y.encodeStateAsUpdate(tempDoc));
        }
      }

      return data.document;
    } catch (error) {
      console.error(`[Persistence Load Error] ${fileId}:`, error.message);
      return data.document;
    }
  },

  async onStoreDocument(data) {
    const { subdomain } = data.context;
    const fileId = data.documentName;

    try {
      const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain);
      const meta = getMetaCache(org?.organisation_id) || getMetaCache(subdomain);
      const node = meta?.nodes?.[fileId];

      if (!org || !node) return;

      const config = getFileConfig(node.extension);
      if (!config.websocket) return;

      org.decrypted_password = decrypt(org.cloud_password_encrypted);
      const fullPath = buildCloudPath(meta.nodes, fileId);

      // Extract readable JSON
      const json = TiptapTransformer.fromYdoc(data.document, 'default', serverExtensions);

      // Extract math history as Base64
      const stateVector = Y.encodeStateAsUpdate(data.document);
      const base64State = Buffer.from(stateVector).toString('base64');

      // NEW: Wrap both into the save payload
      const payload = {
        _meta: { format: "fsrdoc", version: "1.1" },
        documentState: base64State,
        content: json
      };

      const client = await getCloudClient(org);
      await writeJsonDocument(client, fullPath, payload);

      console.log(`[Persistence] Saved ${node.name} to Sciebo at ${fullPath}`);
    } catch (error) {
      console.error(`[Persistence Save Error] ${fileId}:`, error);
    }
  }
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      hocuspocusServer.handleConnection(ws, request);
    });
  } else {
    socket.destroy();
  }
});

app.use(handler);

httpServer.listen(PORT, () => {
  console.log(`\x1b[32m[FSR-OS]\x1b[0m Unified Server running on http://localhost:${PORT}`);
});