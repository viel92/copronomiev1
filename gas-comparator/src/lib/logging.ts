import { Logtail } from '@logtail/browser';

export const logtail = new Logtail(import.meta.env.VITE_LOGTAIL_SOURCE_TOKEN || '');
