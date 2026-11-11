import { describe,it,expect,vi } from 'vitest';
import { ukMobile, extractUkPhone, canClaim, rawGmail, summaryStatus, twilioSignature, verifyTwilio } from '@/lib/server/channels';
import { sendGmail, sendSms } from '@/lib/server/providers.server';

const config = { gatewayKey: 'mock-gateway', gmailKey: 'mock-gmail', twilioKey: 'mock-twilio', smsFrom: '+441213450000', callbackUrl: 'https://example.com/api/public/twilio-status', twilioAuthToken: 'mock-token' };
describe('approved multichannel sends (mocked only)', () => {
  it('normalizes UK mobiles and rejects landlines, missing and personal numbers', () => {
    expect(ukMobile('07700 900123')).toBe('+447700900123');
    expect(ukMobile('0044 7700 900123')).toBe('+447700900123');
    expect(ukMobile('+44 (0)7700 900123')).toBe('+447700900123');
    expect(ukMobile('0121 345 6789')).toBeNull();
    expect(ukMobile('07000 123456')).toBeNull();
    expect(ukMobile(null)).toBeNull();
    expect(extractUkPhone('Mobile: 07700-900123')).toBe('+447700900123');
  });
  it('claims only pending initially and only failed on explicit retry', () => {
    expect(canClaim('pending', false)).toBe(true);
    expect(canClaim('failed', true)).toBe(true);
    for (const state of ['sent','delivered','sending','unknown','skipped']) expect(canClaim(state,true)).toBe(false);
    expect(canClaim('failed',false)).toBe(false);
    expect(canClaim('pending',true)).toBe(false);
  });
  it('preserves partial failures', () => {
    expect(summaryStatus(['sent','failed'])).toBe('failed');
    expect(summaryStatus(['sent','sending'])).toBe('sending');
    expect(summaryStatus(['sent','skipped'])).toBe('sent');
  });
  it('encodes Unicode subject/body and blocks header injection', () => {
    const raw = rawGmail('a@example.com','Quote £160','Hello, £160 no VAT','mock-id');
    const decoded = atob(raw.replace(/-/g,'+').replace(/_/g,'/'));
    expect(decoded).toContain('Subject: =?UTF-8?B?');
    expect(decoded).toContain('From: Sperin Services <info@sperinservices.co.uk>');
    expect(() => rawGmail('a@example.com\r\nBcc: b@example.com','x','text','id')).toThrow();
  });
  it('sends Gmail only after checking exact sender and retains provider ID', async () => {
    const f = vi.fn().mockResolvedValueOnce(Response.json({ emailAddress: 'info@sperinservices.co.uk' })).mockResolvedValueOnce(Response.json({ id: 'gmail-id' }));
    expect(await sendGmail({ to:'a@example.com',subject:'Quote',body:'Approved reply',key:'k' },config,f)).toEqual({ status:'sent',providerId:'gmail-id' });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it('wrong Gmail account never sends', async () => {
    const f = vi.fn().mockResolvedValue(Response.json({ emailAddress:'other@example.com' }));
    expect((await sendGmail({ to:'a@example.com',subject:'Quote',body:'Approved reply',key:'k' },config,f)).status).toBe('failed');
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('marks ambiguous send timeout unknown rather than safely retryable', async () => {
    const f = vi.fn().mockResolvedValueOnce(Response.json({ emailAddress:'info@sperinservices.co.uk' })).mockRejectedValueOnce(new Error('timeout'));
    expect((await sendGmail({ to:'a@example.com',subject:'Quote',body:'Approved reply',key:'k' },config,f)).status).toBe('unknown');
  });
  it('SMS queues with provider ID and signed callback correlation', async () => {
    const f = vi.fn().mockResolvedValue(Response.json({ sid:'SM123',status:'queued' }));
    expect(await sendSms({ to:'+447700900123',body:'Approved SMS',channelId:'c',attempt:'a' },config,f)).toEqual({ status:'sending',providerId:'SM123' });
    expect(String(f.mock.calls[0]?.[1]?.body)).toContain('StatusCallback=');
  });
  it('missing configuration makes no network calls', async () => {
    const f = vi.fn();
    expect((await sendSms({ to:'+447700900123',body:'Approved SMS',channelId:'c',attempt:'a' },{},f)).status).toBe('failed');
    expect(f).not.toHaveBeenCalled();
  });
  it('accepts signed delivery and rejects tampered body or URL', async () => {
    const params = { MessageSid:'SM123',MessageStatus:'delivered' };
    const url='https://example.com/api/public/twilio-status?channel=c&attempt=a';
    const sig=await twilioSignature('mock-token',url,params);
    expect(await verifyTwilio('mock-token',url,params,sig)).toBe(true);
    expect(await verifyTwilio('mock-token',url,{ ...params,MessageStatus:'failed' },sig)).toBe(false);
    expect(await verifyTwilio('mock-token',url+'x',params,sig)).toBe(false);
  });
});