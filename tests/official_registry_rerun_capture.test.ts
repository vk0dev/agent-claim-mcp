import { describe, expect, it } from 'vitest';

import {
  inferVerdict,
  REGISTRY_STEP_NAMES,
  renderVerdictPacket,
  summarizeRegistrySteps,
} from '../scripts/official_registry_rerun_capture.mjs';

describe('official registry rerun capture helper', () => {
  it('captures the registry-relevant workflow steps including MCP Registry auth/publish', () => {
    const summary = summarizeRegistrySteps({
      jobs: [
        {
          steps: [
            { name: 'Publish to npm with provenance', status: 'completed', conclusion: 'success', number: 5 },
            { name: 'Install mcp-publisher', status: 'completed', conclusion: 'success', number: 6 },
            { name: 'Authenticate to MCP Registry', status: 'completed', conclusion: 'success', number: 7 },
            { name: 'Publish to Official MCP Registry', status: 'completed', conclusion: 'success', number: 8 },
          ],
        },
      ],
    });

    expect(summary.map((step) => step.name)).toEqual(REGISTRY_STEP_NAMES);
    expect(summary.every((step) => step.reached)).toBe(true);
    expect(inferVerdict(summary, 'https://example.com/proof')).toBe('PASS');
    expect(inferVerdict(summary, '')).toBe('SOFT-BLOCKED');
  });

  it('treats a live Smithery listing as a valid external proof branch', () => {
    const summary = summarizeRegistrySteps({
      jobs: [
        {
          steps: [
            { name: 'Publish to npm with provenance', status: 'completed', conclusion: 'success', number: 5 },
            { name: 'Install mcp-publisher', status: 'completed', conclusion: 'skipped', number: 6 },
            { name: 'Authenticate to MCP Registry', status: 'completed', conclusion: 'skipped', number: 7 },
            { name: 'Publish to Official MCP Registry', status: 'completed', conclusion: 'skipped', number: 8 },
          ],
        },
      ],
    });

    expect(inferVerdict(summary, '', 'https://smithery.ai/server/agent-claim-mcp')).toBe('PASS');
  });

  it('marks missing registry steps as not reached and yields FAIL on blocking publish/auth failures', () => {
    const summary = summarizeRegistrySteps({
      jobs: [
        {
          steps: [
            { name: 'Publish to npm with provenance', status: 'completed', conclusion: 'success', number: 5 },
            { name: 'Authenticate to MCP Registry', status: 'completed', conclusion: 'failure', number: 7 },
          ],
        },
      ],
    });

    expect(summary.find((step) => step.name === 'Install mcp-publisher')?.reached).toBe(false);
    expect(summary.find((step) => step.name === 'Publish to Official MCP Registry')?.conclusion).toBe('not_reached');
    expect(inferVerdict(summary, '')).toBe('FAIL');
  });

  it('keeps the tracked pre-rerun npm-secret failure lane soft-blocked when registry validation was never reached', () => {
    const summary = summarizeRegistrySteps({
      jobs: [
        {
          steps: [
            { name: 'Publish to npm with provenance', status: 'completed', conclusion: 'failure', number: 9 },
            { name: 'Install mcp-publisher', status: 'completed', conclusion: 'skipped', number: 10 },
            { name: 'Authenticate to MCP Registry', status: 'completed', conclusion: 'skipped', number: 11 },
            { name: 'Publish to Official MCP Registry', status: 'completed', conclusion: 'skipped', number: 12 },
          ],
        },
      ],
    });

    expect(summary.find((step) => step.name === 'Authenticate to MCP Registry')?.reached).toBe(false);
    expect(summary.find((step) => step.name === 'Publish to Official MCP Registry')?.reached).toBe(false);
    expect(inferVerdict(summary, '')).toBe('SOFT-BLOCKED');
  });

  it('renders a copy-pasteable packet with run identity, public proof slot, and suggested verdict', () => {
    const stepSummary = summarizeRegistrySteps({ jobs: [{ steps: [] }] });
    const output = renderVerdictPacket({
      run: { databaseId: 25282612113, html_url: 'https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113', head_branch: 'main', head_sha: 'abc123' },
      stepSummary,
      publicProofUrl: '',
      smitheryUrl: '',
      verdict: inferVerdict(stepSummary, ''),
    });

    expect(output).toContain('25282612113');
    expect(output).toContain('Official MCP Registry proof URL: ABSENT');
    expect(output).toContain('Smithery listing URL: ABSENT');
    expect(output).toContain('Verdict: SOFT-BLOCKED');
    expect(output).toContain('Publish to Official MCP Registry');
  });
});
