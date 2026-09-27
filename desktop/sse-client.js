// Minimal SSE-over-POST client for the klothulhu-api contract.
// Runs in the Electron main process so the token never reaches the renderer.
'use strict';

const FIRST_EVENT_TIMEOUT_MS = 30000;

async function streamChat({ apiUrl, token, text, signal, onEvent }) {
  const firstEvent = new AbortController();
  const timer = setTimeout(() => firstEvent.abort(), FIRST_EVENT_TIMEOUT_MS);
  const combined = AbortSignal.any([signal, firstEvent.signal]);

  let res;
  try {
    res = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text }),
      signal: combined,
    });
  } catch (err) {
    clearTimeout(timer);
    if (signal.aborted) return;
    onEvent('error', { code: firstEvent.signal.aborted ? 'timeout' : 'unreachable' });
    return;
  }
  if (!res.ok) {
    clearTimeout(timer);
    onEvent('error', { code: `http_${res.status}` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let gotEvent = false;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let sep;
      while ((sep = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        const parsed = parseBlock(block);
        if (!parsed) continue;
        if (!gotEvent) { gotEvent = true; clearTimeout(timer); }
        onEvent(parsed.event, parsed.data);
      }
    }
  } catch (err) {
    if (signal.aborted) return;
    onEvent('error', { code: firstEvent.signal.aborted ? 'timeout' : 'stream_broken' });
  } finally {
    clearTimeout(timer);
  }
}

function parseBlock(block) {
  let event = 'message';
  const data = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  try { return { event, data: JSON.parse(data.join('\n')) }; }
  catch { return null; }
}

async function forget({ apiUrl, token }) {
  const res = await fetch(`${apiUrl}/history`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

module.exports = { streamChat, forget, parseBlock };
