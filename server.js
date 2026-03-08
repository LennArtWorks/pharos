import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { Hocuspocus } from '@hocuspocus/server';
import { TiptapTransformer } from '@hocuspocus/transformer';
import { handler } from './build/handler.js';

// Headless Tiptap Extensions for Server-side Schema
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

// ADDED: We need decrypt so getCloudClient can actually log into Sciebo
import { decrypt } from './src/lib/server/auth/crypto.ts';

const PORT = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);

// ADDED: Helper to turn parentId relationships into a real WebDAV folder path
function buildCloudPath(cloudDirectory, nodes, targetId) {
  let current = nodes[targetId];
  if (!current) return null;

  let pathSegments = [current.physicalName];

  while (current.parentId) {
    current = nodes[current.parentId];
    if (current && current.physicalName) {
      pathSegments.unshift(current.physicalName);
    } else {
      break;
    }
  }

  const basePath = cloudDirectory ? `/${cloudDirectory}` : '';
  return `${basePath}/${pathSegments.join('/')}`.replace(/\/+/g, '/'); // ensure no double slashes
}

const hocuspocusServer = new Hocuspocus({
  async onConnect(data) {
    const host = data.request.headers.host || '';
    const subdomain = host.split('.')[0];
    return { subdomain };
  },

  async onLoadDocument(data) {
    const { subdomain } = data.context;
    const fileId = data.documentName;

    console.log(`[Persistence] Loading: ${fileId} for ${subdomain}`);

    try {
      const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain);
      if (!org) throw new Error("Organisation not found");

      // ADDED: Decrypt the password for the cloud client
      org.decrypted_password = decrypt(org.cloud_password_encrypted);

      const meta = getMetaCache(org.organisation_id) || getMetaCache(subdomain);
      const node = meta?.nodes?.[fileId];

      if (!node) {
        throw new Error("File not found in RAM cache index");
      }

      // ADDED: Calculate the true Sciebo path
      const fullPath = buildCloudPath(org.cloud_directory, meta.nodes, fileId);
      console.log(`[Persistence] Mapped ID to Sciebo Path: ${fullPath}`);

      const client = await getCloudClient(org);
      const remoteJson = await readJsonDocument(client, fullPath);

      if (!remoteJson) return data.document;

      return TiptapTransformer.toYdoc(remoteJson, 'default', serverExtensions);
    } catch (error) {
      console.error(`[Persistence Load Error] ${fileId}:`, error.message);
      return data.document; // return empty doc on fail
    }
  },

  async onStoreDocument(data) {
    const { subdomain } = data.context;
    const fileId = data.documentName;

    try {
      const org = db.prepare('SELECT * FROM organisations WHERE subdomain = ?').get(subdomain);

      // ADDED: Decrypt the password for the cloud client
      org.decrypted_password = decrypt(org.cloud_password_encrypted);

      const meta = getMetaCache(org.organisation_id) || getMetaCache(subdomain);
      const node = meta?.nodes?.[fileId];

      if (!org || !node) return;

      // ADDED: Calculate the true Sciebo path
      const fullPath = buildCloudPath(org.cloud_directory, meta.nodes, fileId);

      const json = TiptapTransformer.fromYdoc(data.document, 'default', serverExtensions);
      const client = await getCloudClient(org);
      await writeJsonDocument(client, fullPath, json);

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

// SvelteKit handler
app.use(handler);

httpServer.listen(PORT, () => {
  console.log(`\x1b[32m[FSR-OS]\x1b[0m Unified Server running on http://localhost:${PORT}`);
});