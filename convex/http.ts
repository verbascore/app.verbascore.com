import { httpRouter } from "convex/server";

import {
  clientOutboundTwiml,
  outboundRecording,
  outboundStatus,
  outboundTwiml,
} from "./telephony";

import { sonioxWebhook } from "./sonioxWebhook";

const http = httpRouter();

http.route({
  path: "/twilio/outbound/twiml",
  method: "POST",
  handler: outboundTwiml,
});

http.route({
  path: "/twilio/client/outbound/twiml",
  method: "POST",
  handler: clientOutboundTwiml,
});

http.route({
  path: "/twilio/outbound/status",
  method: "POST",
  handler: outboundStatus,
});

http.route({
  path: "/twilio/outbound/recording",
  method: "POST",
  handler: outboundRecording,
});

http.route({
  path: "/soniox/notify",
  method: "POST",
  handler: sonioxWebhook,
});

export default http;
