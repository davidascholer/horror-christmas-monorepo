/**
 * Browser entry (the Rollup input of `vite build`, and the script that
 * index.html loads in dev). The static generator links the built version of
 * this file into every page.
 */
import './styles.css';
import { createQueryClient } from './api/query-client';
import { mountApp } from './client/mount';

const container = document.getElementById('root');
if (!container) throw new Error('#root not found: cannot start the app');
mountApp({ container, queryClient: createQueryClient() });
