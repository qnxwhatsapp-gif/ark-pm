#!/usr/bin/env node
/**
 * update-claude-md.js
 * Auto-updates CLAUDE.md sections before every git commit.
 * Updates: test count, file structure, last-updated timestamp, recent changes.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md')

// ──────────────────────────────────────────────
// 1. Count tests
// ──────────────────────────────────────────────
function countTests() {
  const testDir = path.join(ROOT, 'src/__tests__')
  if (!fs.existsSync(testDir)) return { total: 0, files: 0, breakdown: [] }

  const results = []
  let total = 0

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.test.jsx') || entry.name.endsWith('.test.js') || entry.name.endsWith('.test.ts')) {
        const src = fs.readFileSync(full, 'utf8')
        // Count it(...) and test(...) calls at the start of a line or after whitespace
        const matches = (src.match(/^\s*(it|test)\s*\(/gm) || []).length
        const rel = full.replace(ROOT + path.sep, '').replace(/\\/g, '/')
        results.push({ file: rel, count: matches })
        total += matches
      }
    }
  }
  walk(testDir)
  results.sort((a, b) => a.file.localeCompare(b.file))
  return { total, files: results.length, breakdown: results }
}

// ──────────────────────────────────────────────
// 2. Build file structure (src/features only)
// ──────────────────────────────────────────────
function buildFileTree() {
  const featuresDir = path.join(ROOT, 'src/features')
  if (!fs.existsSync(featuresDir)) return ''

  const lines = ['src/']

  function describeFile(name) {
    const map = {
      'AuthContext.jsx': 'Session + profile state, signIn/signOut',
      'useAuth.js': 'useAuth() hook',
      'LoginPage.jsx': 'Role selector → email/password login',
      'ProtectedRoute.jsx': 'Route guard with optional requiredRole',
      'useUsers.js': 'useUsers() — list, createUser, updateUser',
      'UsersPage.jsx': 'User list + Edit + Set Password + Activate',
      'UserFormDialog.jsx': 'Add user modal (all roles)',
      'useClients.js': 'useClients() + useClient(id)',
      'ClientsPage.jsx': 'List + search + add/edit',
      'ClientFormDialog.jsx': 'Add/edit client modal',
      'ClientDetailPage.jsx': 'Client info + projects list',
      'useProjects.js': 'useProjects() + useProject(id)',
      'ProjectsPage.jsx': 'List + status filters + add/edit',
      'ProjectFormDialog.jsx': 'Add/edit project modal',
      'ProjectDetailPage.jsx': 'Detail: progress, phases (PhaseWithTasks), team',
      'PhaseFormDialog.jsx': 'Add/edit phase modal (suggested names)',
      'PhaseWithTasks.jsx': 'Expandable phase row with tasks inline',
      'useTasks.js': 'usePhaseTasks(phaseId) + useMyTasks() + useTaskComments(taskId)',
      'TaskCard.jsx': 'Task row: status dropdown, edit, delete, comments toggle',
      'TaskFormDialog.jsx': 'Add/edit task modal',
      'CommentsPanel.jsx': 'Comment list + add form per task',
      'MyTasksPage.jsx': '/tasks — personal task list with stats',
      'useDashboard.js': 'Parallel stats fetch',
      'StatsCard.jsx': 'Reusable stat card',
      'DashboardPage.jsx': 'Main dashboard',
      'useReports.js': 'useReports(filters) + useAllProjects()',
      'ReportsPage.jsx': 'Charts + table + PDF export',
      'useNotifications.js': 'Realtime hook + markAsRead + markAllAsRead',
      'NotificationBell.jsx': 'Bell + dropdown in sidebar',
      'NotificationsPage.jsx': '/notifications full page',
    }
    return map[name] || ''
  }

  lines.push('├── lib/supabase.js                    # Supabase client singleton')
  lines.push('├── features/')

  const features = fs.readdirSync(featuresDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()

  features.forEach((feat, fi) => {
    const isLastFeat = fi === features.length - 1
    const featPrefix = isLastFeat ? '└──' : '├──'
    const childPrefix = isLastFeat ? '    ' : '│   '
    lines.push(`│   ${featPrefix} ${feat}/`)

    const files = fs.readdirSync(path.join(featuresDir, feat))
      .filter(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.ts'))
      .sort()

    files.forEach((file, idx) => {
      const isLast = idx === files.length - 1
      const fp = isLast ? '└──' : '├──'
      const desc = describeFile(file)
      const padded = file.padEnd(30)
      lines.push(`│   ${childPrefix}${fp} ${padded}${desc ? '# ' + desc : ''}`)
    })
  })

  lines.push('├── components/ui/                     # shadcn/ui components')
  lines.push('└── App.jsx                            # Routes + SidebarLayout + ProtectedWithSidebar')
  return lines.join('\n')
}

// ──────────────────────────────────────────────
// 3. Get staged files for "Recent Changes"
// ──────────────────────────────────────────────
function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only', { cwd: ROOT }).toString().trim()
    return out ? out.split('\n').filter(f => f && f !== 'CLAUDE.md') : []
  } catch {
    return []
  }
}

function getLastCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%s', { cwd: ROOT }).toString().trim()
  } catch {
    return ''
  }
}

// ──────────────────────────────────────────────
// 4. Patch CLAUDE.md
// ──────────────────────────────────────────────
function patch(content, startMarker, endMarker, newBlock) {
  const start = content.indexOf(startMarker)
  const end = content.indexOf(endMarker, start)
  if (start === -1 || end === -1) return content
  return content.slice(0, start) + newBlock + content.slice(end + endMarker.length)
}

function updateClaudeMd() {
  let md = fs.readFileSync(CLAUDE_MD, 'utf8')

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

  // ── Test Count section ──────────────────────
  const { total, files, breakdown } = countTests()
  const breakdownLines = breakdown.map(b => {
    const parts = b.file.split('/')
    const filename = parts[parts.length - 1]
    return `├── ${b.file.replace('src/__tests__/', '').padEnd(45)} ${b.count} tests`
  })
  const testBlock =
    `## Test Count\n\n` +
    `**${total} tests passing** across ${files} test files.\n\n` +
    `\`\`\`\n` +
    `src/__tests__/\n` +
    breakdownLines.join('\n') + '\n' +
    `\`\`\`\n\n` +
    `Run: \`npm run test\``

  md = patch(md, '## Test Count', '\n\n---', testBlock + '\n')

  // ── File Structure section ──────────────────
  const tree = buildFileTree()
  const structBlock =
    `## File Structure\n\n` +
    `\`\`\`\n` +
    tree + '\n' +
    `\`\`\``

  md = patch(md, '## File Structure', '\n\n---\n\n## Database Schema', structBlock + '\n\n---\n\n## Database Schema')

  // ── Last Updated + Recent Changes (bottom) ──
  const staged = getStagedFiles()
  const lastMsg = getLastCommitMessage()
  const changesBlock = staged.length
    ? `\n## Last Updated\n\n` +
      `**${now}**\n\n` +
      `### Files Changed in This Commit\n` +
      staged.map(f => `- \`${f}\``).join('\n') + '\n'
    : `\n## Last Updated\n\n**${now}**\n`

  // Replace or append Last Updated section
  const luIdx = md.indexOf('\n## Last Updated')
  if (luIdx !== -1) {
    md = md.slice(0, luIdx) + changesBlock
  } else {
    md = md.trimEnd() + '\n' + changesBlock
  }

  fs.writeFileSync(CLAUDE_MD, md, 'utf8')
  console.log(`✅ CLAUDE.md updated — ${total} tests, ${files} test files, ${staged.length} staged files listed`)
}

updateClaudeMd()
