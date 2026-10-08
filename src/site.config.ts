/*
  Site information lives here. Edit this file to update the site.
  Projects and posts live in src/content/. Everything below is shown on public pages,
  so never put real internal hostnames, IPs or secrets here.
*/

export interface Link { id: string; label: string; url: string }
export interface Page {
  id: string;
  path: string;
  title: string;
  blurb: string;
  /* The file inside the page's folder in the terminal. Defaults to README.md. */
  file?: string;
  /* Extra command names that open the page, for example `blog` for writing. */
  aliases?: string[];
  /* Optional launch date (YYYY-MM-DD). Pages with a date show up in `git log`. */
  date?: string;
}
export interface Service {
  unit: string;
  description: string;
  user: string;
  cmd: string;
  image?: string;
  uptime?: string;
  gpu?: boolean;
  cpu?: number;
  mem?: number;
}
export interface ManOption { flag: string; text: string; see?: { label: string; cmd: string } }

export interface SiteConfig {
  domain: string;
  url: string;
  /* Short name: the logo wordmark, the tmux session name and the page header. */
  brand: string;
  description: string;
  owner: { name: string; short: string; role: string; focus: string; stack: string; location: string; langs: string; timeZone: string };
  links: Link[];
  pages: Page[];
  machine: {
    host: string;
    user: string;
    os: string;
    distro: string;
    kernel: string;
    shell: string;
    consoleIp: string;
    cpus: number;
    memGiB: number;
    gpu: { name: string; memMiB: number; driver: string; cuda: string };
  };
  services: Service[];
  readme: string[];
  man: { name: string; synopsis: string; description: string[]; options: ManOption[]; environment: string[]; bugs: string };
  fortunes: string[];
}

export const site: SiteConfig = {
  domain: 'jaalip.com',
  url: 'https://jaalip.com',
  brand: 'jaalip',
  description: 'Jaakko Lipponen, AI specialist and consultant in Helsinki. Self-hosted, GDPR-compliant LLM platforms.',

  owner: {
    name: 'Jaakko Lipponen',
    short: 'Jaakko',
    role: 'AI specialist and consultant',
    focus: 'Self-hosted, GDPR-compliant LLM platforms for EU enterprises',
    stack: 'Kafka, Azure, Python, Proxmox, vLLM, observability',
    location: 'Helsinki, FI (from Turku)',
    langs: 'fi, en',
    /* Clock, `date`, `uptime`, file dates and last login use this time zone. */
    timeZone: 'Europe/Helsinki',
  },

  /* Contact: shown by `contact`, `cat contact.txt`, the footer and the noscript fallback. */
  links: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/JaakkoLipp' },
    { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/jaakko-lipponen/' },
  ],

  /*
    Pages outside the terminal. Each one is also a folder in `ls ~`, which works as the site menu.
    projects and writing have their own routes. Any other page needs src/content/pages/<id>.md.
  */
  pages: [
    { id: 'projects', path: '/projects', title: 'Projects', blurb: 'Things I build and run. Each one is also an executable in the terminal.' },
    { id: 'paper', path: '/paper', title: 'Daily AI newspaper', blurb: 'A daily HTML newspaper, written by a local LLM pipeline.', file: 'today.html' },
    { id: 'keymap', path: '/keymap', title: 'Sofle keymap', blurb: 'Quick reference for the layers on my Sofle split keyboard.', file: 'sofle.md' },
    { id: 'writing', path: '/writing', title: 'Writing', blurb: 'Notes on LLM platforms, infrastructure and the tools around them.', aliases: ['blog'] },
  ],

  /* The machine the terminal pretends to be. `host` is the public VPS that serves this site. */
  machine: {
    host: 'netwatch',
    user: 'guest',
    os: 'Proxmox VE 9.0',
    distro: 'Debian GNU/Linux 13 (trixie)',
    kernel: '6.14.8-2-pve',
    shell: 'jsh 1.0',
    /* Shown in the Proxmox console banner. Keep it in a documentation range (203.0.113.0/24). */
    consoleIp: '203.0.113.42',
    /* Simulated hardware for htop and nvidia-smi. */
    cpus: 4,
    memGiB: 128,
    gpu: { name: 'RTX 3090', memMiB: 24576, driver: '570.172.08', cuda: '12.8' },
  },

  /*
    Services. Each one gets a "Started ..." line in the boot log and a row in htop.
    `image` adds a row to `docker ps`. `gpu: true` lists it in nvidia-smi.
    `cpu` (percent) and `mem` (percent of RAM) seed the htop simulation.
  */
  services: [
    { unit: 'wg-quick@wg0', description: 'WireGuard tunnel to the homelab', user: 'root', cmd: 'wg-quick up wg0', cpu: 0.2, mem: 0.0 },
    { unit: 'caddy', description: 'Caddy web server', user: 'caddy', cmd: 'caddy run --config /etc/caddy/Caddyfile', cpu: 0.5, mem: 0.1 },
    { unit: 'kafka', description: 'Kafka broker (evaluation events)', user: 'kafka', cmd: 'java -Xmx4G kafka.Kafka server.properties', cpu: 9, mem: 3.4 },
    { unit: 'vllm', description: 'vLLM inference server', user: 'vllm', cmd: 'vllm serve Qwen/Qwen3-27B', image: 'vllm/vllm-openai', uptime: 'Up 12 days', gpu: true, cpu: 85, mem: 16.8 },
    { unit: 'litellm', description: 'LiteLLM proxy', user: 'litellm', cmd: 'litellm --config /etc/litellm/config.yaml', image: 'ghcr.io/berriai/litellm', uptime: 'Up 12 days', cpu: 4, mem: 0.6 },
    { unit: 'open-webui', description: 'Open WebUI', user: 'webui', cmd: 'open-webui serve', image: 'ghcr.io/open-webui/open-webui', uptime: 'Up 9 days', cpu: 3, mem: 0.9 },
    { unit: 'langfuse', description: 'Langfuse LLM tracing', user: 'lfuse', cmd: 'node langfuse/web/server.js', image: 'langfuse/langfuse', uptime: 'Up 9 days', cpu: 2, mem: 0.7 },
    { unit: 'searxng', description: 'SearXNG metasearch', user: 'searxng', cmd: 'uwsgi --ini searxng.ini', image: 'searxng/searxng', uptime: 'Up 9 days', cpu: 1, mem: 0.2 },
    { unit: 'n8n', description: 'n8n workflow automation', user: 'n8n', cmd: 'n8n start', image: 'n8nio/n8n', uptime: 'Up 3 days', cpu: 1, mem: 0.4 },
  ],

  /* `cat ~/README.md` */
  readme: [
    'Welcome to jaalip.com.',
    'This is a terminal, but you do not need to know Linux.',
    'Click anything underlined. The folders in ~ open the pages.',
    'Every project in ~/projects is a program. Type its name to run it.',
    'Type help to see all commands.',
  ],

  /* `man jaakko`. Option links run a terminal command when clicked. */
  man: {
    name: 'jaakko - AI specialist and consultant, Helsinki',
    synopsis: 'jaakko [--consult] [--build] [--evaluate] <problem>',
    description: [
      'Designs self-hosted, GDPR-compliant LLM platforms for EU enterprises.',
      'Works across the full chain: infrastructure, model serving, event pipelines, observability and evaluation. Prefers simple systems that you can trace and reproduce.',
    ],
    options: [
      { flag: '--consult', text: 'AI systems design and AI governance for EU-sovereign infrastructure.' },
      { flag: '--build', text: 'DevOps, Kafka event pipelines, Azure and Python services.' },
      { flag: '--evaluate', text: 'LLM and RAG evaluation.', see: { label: 'llm-eval-service(1)', cmd: 'llm-eval-service' } },
    ],
    environment: ['LANG=fi_FI.UTF-8 en_US.UTF-8', 'TZ=Europe/Helsinki'],
    bugs: 'Upgrades the homelab instead of sleeping. Has strong opinions about split keyboards.',
  },

  /* `fortune` */
  fortunes: [
    'The best GPU is the one that is already passed through.',
    'There is no cloud. There is only a data center, ideally inside the EU.',
    'Your offsets are committed. Your feelings are not.',
    'In Finland, silence is a feature, not a bug.',
    'It works on netwatch.',
    'Read the release notes before you upgrade.',
    'A log line today saves a war room tomorrow.',
    'If it is not in the trace, it did not happen.',
  ],
};
