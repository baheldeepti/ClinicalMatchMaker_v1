import{c as I}from"./index-D8dkGBQT.js";import{o as s,s as e}from"./types-BqB19gy9.js";/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=I("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=I("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=I("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.344.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=I("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),o={VITE_ELEVENLABS_API_KEY:"sk_cc27f134402bf7aee87b791dfc8b3ba46f2e50b0ecad69bc",VITE_RTRVR_API_KEY:"rtrvr_wmSQXFPNwKG42p8V32kdwbxcL101lCaBCM1weaopzOA",VITE_STRIPE_PUBLISHABLE_KEY:"pk_test_placeholder",VITE_TOOLHOUSE_API_KEY:"th-M00coAJoM_zSQr1D38YdisTboOaKHU0rqV69Jp3Q948"},T=s({VITE_TOOLHOUSE_API_KEY:e().default(""),VITE_RTRVR_API_KEY:e().default(""),VITE_ELEVENLABS_API_KEY:e().default(""),VITE_STRIPE_PUBLISHABLE_KEY:e().default(""),VITE_CLINICALTRIALS_API_BASE:e().url().default("https://clinicaltrials.gov/api/v2")});let E=null;function a(){if(E)return E;const _=o,t=T.safeParse({VITE_TOOLHOUSE_API_KEY:_.VITE_TOOLHOUSE_API_KEY,VITE_RTRVR_API_KEY:_.VITE_RTRVR_API_KEY,VITE_ELEVENLABS_API_KEY:_.VITE_ELEVENLABS_API_KEY,VITE_STRIPE_PUBLISHABLE_KEY:_.VITE_STRIPE_PUBLISHABLE_KEY,VITE_CLINICALTRIALS_API_BASE:_.VITE_CLINICALTRIALS_API_BASE});if(!t.success){const n=t.error.issues.map(r=>r.path.join(".")).join(", ");throw new Error(`Missing or invalid environment variables: ${n}. Please check your .env file and ensure all required API keys are set.`)}return E=t.data,E}function S(){return a().VITE_ELEVENLABS_API_KEY}function l(){return a().VITE_STRIPE_PUBLISHABLE_KEY}export{V as C,P as X,i as a,L as b,l as c,S as g};
//# sourceMappingURL=config-D0i5S2kZ.js.map
