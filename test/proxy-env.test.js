import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bypassesEnvNoProxy,
  readProxyEnv,
  shouldUseProcessProxy,
} from '../lib/proxy-env.js';

const nonPublic = (host) => host === '127.0.0.1' || host === '10.0.0.1';

test('readProxyEnv picks HTTPS_PROXY over HTTP_PROXY', () => {
  const prev = {
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    HTTP_PROXY: process.env.HTTP_PROXY,
  };
  process.env.HTTPS_PROXY = 'http://proxy.example:8080';
  process.env.HTTP_PROXY = 'http://other:8080';
  try {
    assert.equal(readProxyEnv(), 'http://proxy.example:8080');
  } finally {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('bypassesEnvNoProxy matches suffix entries', () => {
  const prev = process.env.NO_PROXY;
  process.env.NO_PROXY = 'localhost,.zte.com.cn';
  try {
    assert.equal(bypassesEnvNoProxy(new URL('https://api.zte.com.cn/v1')), true);
    assert.equal(bypassesEnvNoProxy(new URL('https://dashscope.aliyuncs.com/mcp')), false);
  } finally {
    if (prev === undefined) delete process.env.NO_PROXY;
    else process.env.NO_PROXY = prev;
  }
});

test('shouldUseProcessProxy respects NO_PROXY bypass', () => {
  const prev = {
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    NO_PROXY: process.env.NO_PROXY,
  };
  process.env.HTTPS_PROXY = 'http://proxy.zte.com.cn:80';
  process.env.NO_PROXY = '.zte.com.cn';
  try {
    assert.equal(
      shouldUseProcessProxy(new URL('https://dashscope.aliyuncs.com/mcp'), nonPublic),
      true,
    );
    assert.equal(
      shouldUseProcessProxy(new URL('https://llm.zte.com.cn/v1'), nonPublic),
      false,
    );
    assert.equal(
      shouldUseProcessProxy(new URL('https://127.0.0.1/mcp'), nonPublic),
      false,
    );
  } finally {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
