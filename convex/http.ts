import { httpRouter } from "convex/server";

import {
  outboundRecording,
  outboundStatus,
  outboundTwiml,
} from "./telephony";

const http = httpRouter();

http.route({
  path: "/twilio/outbound/twiml",
  method: "POST",
  handler: outboundTwiml,
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

export default http;
