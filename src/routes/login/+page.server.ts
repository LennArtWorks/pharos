/**
 * @route /login 
 * Exposes the form actions for the multi-step login process.
 * Logic is offloaded to the src/lib/server/auth/login directory.
 */

import { discover } from '$lib/server/auth/login/discover';
import { verifyEmail } from '$lib/server/auth/login/verifyEmail';
import { challengeTotp } from '$lib/server/auth/login/challengeTotp';
import { finalizeSignup } from '$lib/server/auth/login/finalizeSignup';

export const actions = {
  discover,
  verifyEmail,
  challengeTotp,
  finalizeSignup
};