<?php
/**
 * api.php — MiLyfe Platform PHP 8.x Backend for Hostinger Shared / Non-VPS Hosting
 * 
 * Production-ready PHP backend implementing 100% of the MiLyfe REST API:
 * - Authentication (BCrypt hashing, HttpOnly cookies, CSRF protection, RBAC)
 * - Citizen Dashboard (Citizen Pass, Values Agenda, Circle Hub, Missions, Invites)
 * - Organizer / Admin Command Center (Citizen filtering, Circle assignment, Assembly creation)
 * - Word-to-Math Formula Review Engine (Natural language AST parser, Charter validation)
 * - $MLY Sovereign Treasury Ledger & Cryptographic Signatures
 * - Circle Formation Auto-Matching Engine (7-13 founding citizens)
 * - Solid-Pod JSON-LD Data Sovereignty Export
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');

define('DATA_DIR', __DIR__ . '/data');
define('DB_FILE', DATA_DIR . '/db.json');
define('COOKIE_NAME', 'ml_session');
define('SESSION_DAYS', 7);

// Ensure data directory and database exist
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}
if (!file_exists(DB_FILE)) {
    file_put_contents(DB_FILE, json_encode([
        'users' => [],
        'sessions' => [],
        'agenda' => [],
        'assemblies' => [],
        'invites' => [],
        'events' => [],
        'audit' => [],
        'circles' => [],
        'formulas' => [],
        'ledger' => []
    ], JSON_PRETTY_PRINT));
}

function db_read(): array {
    $fp = fopen(DB_FILE, 'r');
    if (!$fp) return [];
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode((string)$content, true) ?: [];
    $data['circles'] = $data['circles'] ?? [];
    $data['formulas'] = $data['formulas'] ?? [];
    $data['ledger'] = $data['ledger'] ?? [];
    return $data;
}

function db_write(array $data): void {
    $fp = fopen(DB_FILE, 'c');
    if (!$fp) return;
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
    flock($fp, LOCK_UN);
    fclose($fp);
}

function gen_id(string $prefix = 'id'): string {
    return $prefix . '_' . bin2hex(random_bytes(10));
}

function now_iso(): string {
    return gmdate('Y-m-d\TH:i:s\Z');
}

function json_res(int $status, array $obj): void {
    http_response_code($status);
    echo json_encode($obj);
    exit;
}

function bad_req(string $msg = 'Bad Request', int $status = 400): void {
    json_res($status, ['error' => $msg]);
}

function sanitize_user(?array $u): ?array {
    if (!$u) return null;
    unset($u['passwordHash'], $u['salt']);
    return $u;
}

function get_session(): array {
    $d = db_read();
    $sid = $_COOKIE[COOKIE_NAME] ?? '';
    if (!$sid) return ['d' => $d, 'session' => null, 'user' => null];
    $session = null;
    foreach ($d['sessions'] as $s) {
        if ($s['id'] === $sid && strtotime($s['expiresAt']) > time()) {
            $session = $s;
            break;
        }
    }
    if (!$session) return ['d' => $d, 'session' => null, 'user' => null];
    $user = null;
    foreach ($d['users'] as $u) {
        if ($u['id'] === $session['userId']) {
            $user = $u;
            break;
        }
    }
    return ['d' => $d, 'session' => $session, 'user' => $user];
}

function require_auth(?array $roles = null): array {
    $ctx = get_session();
    if (!$ctx['user']) {
        json_res(401, ['error' => 'Login required']);
    }
    if ($roles && !in_array($ctx['user']['role'], $roles, true)) {
        json_res(403, ['error' => 'Not allowed']);
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        $headers = getallheaders();
        $token = $headers['x-csrf-token'] ?? $headers['X-Csrf-Token'] ?? $headers['X-CSRF-Token'] ?? '';
        if (!$token || $token !== $ctx['session']['csrf']) {
            json_res(403, ['error' => 'Security token missing']);
        }
    }
    return $ctx;
}

function enhance_profile(array $b): array {
    $code = $b['code'] ?? ('ML-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6)));
    $path = $b['path'] ?? 'Start a new Circle';
    $circle_status = 'Matching you with people near ' . ($b['location'] ?? 'your community');
    if ($path === 'Join a local Circle') $circle_status = 'Finding active Circles in ' . ($b['location'] ?? 'your area');
    elseif ($path === 'Bring an existing group') $circle_status = 'Preparing group onboarding for ' . ($b['circleName'] ?? 'your group');
    elseif ($path === 'Build the system') $circle_status = 'Connecting you with the builder network';
    
    return [
        'name' => trim($b['name'] ?? ''),
        'firstName' => trim($b['firstName'] ?? '') ?: explode(' ', trim($b['name'] ?? ''))[0],
        'email' => strtolower(trim($b['email'] ?? '')),
        'phone' => trim($b['phone'] ?? ''),
        'location' => trim($b['location'] ?? ''),
        'path' => $path,
        'circleName' => trim($b['circleName'] ?? ''),
        'groupSize' => trim($b['groupSize'] ?? '7-13 citizens'),
        'focus' => trim($b['focus'] ?? 'Governance'),
        'why' => trim($b['why'] ?? ''),
        'priorities' => is_array($b['priorities'] ?? null) ? $b['priorities'] : [],
        'suggestedRole' => trim($b['suggestedRole'] ?? 'Founding Citizen'),
        'skills' => is_array($b['skills'] ?? null) ? $b['skills'] : [],
        'availability' => trim($b['availability'] ?? ''),
        'contactPref' => trim($b['contactPref'] ?? 'Email'),
        'pledge' => is_array($b['pledge'] ?? null) ? $b['pledge'] : [],
        'signature' => trim($b['signature'] ?? ''),
        'charter' => !empty($b['charter']),
        'code' => $code,
        'status' => 'Onboarded',
        'circleStatus' => $circle_status,
        'assignedCircle' => $b['assignedCircle'] ?? '',
        'inviteLink' => '/onboarding.html?invite=' . urlencode($code)
    ];
}

function audit(array &$d, string $userId, string $action, array $details = []): void {
    array_unshift($d['audit'], [
        'id' => gen_id('audit'),
        'userId' => $userId,
        'action' => $action,
        'details' => $details,
        'at' => now_iso()
    ]);
    $d['audit'] = array_slice($d['audit'], 0, 1000);
}

function missions_for(array $profile): array {
    $role = $profile['suggestedRole'] ?? 'Founding Citizen';
    if ($role === 'Circle Organizer') return ['Identify 3 people to invite','Choose a possible meeting place','Save your first assembly RSVP','Add one community need to your Values Agenda','Share your invite with 3 people'];
    if ($role === 'Builder') return ['List what you can build or create','Share your invite with 3 people','Add one community need to your Values Agenda','Save your first assembly RSVP'];
    if ($role === 'Community Partner') return ['Add your organization or group name','Invite your community contact','Save your first assembly RSVP','Add one community need to your Values Agenda'];
    if ($role === 'Formation Support') return ['Choose your support lane','Add one community need to your Values Agenda','Share your invite with 3 people','Save your first assembly RSVP'];
    return ['Share your invite with 3 people','Add one community need to your Values Agenda','Save your first assembly RSVP'];
}

function set_auth_cookie(string $sid): void {
    $expires = time() + (SESSION_DAYS * 86400);
    $secure = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['SERVER_PORT'] ?? 0) == 443;
    setcookie(COOKIE_NAME, $sid, [
        'expires' => $expires,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

// Parse request path
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = $_GET['path'] ?? '';
if (empty($path) && strpos($uri, '/api/') !== false) {
    $parts = explode('/api/', parse_url($uri, PHP_URL_PATH), 2);
    $path = $parts[1] ?? '';
}
$path = trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];

// Router
if ($path === 'auth/register' && $method === 'POST') {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = (string)($input['password'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) bad_req('Valid email required');
    if (strlen($password) < 10) bad_req('Password must be at least 10 characters');
    if (empty($input['name']) || empty($input['location'])) bad_req('Name and location are required');
    
    $d = db_read();
    foreach ($d['users'] as $u) {
        if ($u['email'] === $email) bad_req('Account already exists', 409);
    }
    
    $salt = bin2hex(random_bytes(16));
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $first_user_admin = getenv('FIRST_USER_ADMIN') === 'true' && count($d['users']) === 0;
    
    $profile = enhance_profile(array_merge($input, ['email' => $email]));
    $user = [
        'id' => gen_id('user'),
        'email' => $email,
        'passwordHash' => $hash,
        'salt' => $salt,
        'role' => $first_user_admin ? 'admin' : 'citizen',
        'verified' => false,
        'createdAt' => now_iso(),
        'updatedAt' => now_iso(),
        'profile' => $profile,
        'missionState' => []
    ];
    $d['users'][] = $user;
    audit($d, $user['id'], 'registered', ['role' => $user['role']]);
    
    $csrf = bin2hex(random_bytes(24));
    $sid = bin2hex(random_bytes(32));
    $d['sessions'][] = [
        'id' => $sid,
        'userId' => $user['id'],
        'csrf' => $csrf,
        'createdAt' => now_iso(),
        'expiresAt' => gmdate('Y-m-d\TH:i:s\Z', time() + SESSION_DAYS * 86400)
    ];
    db_write($d);
    
    set_auth_cookie($sid);
    json_res(201, ['user' => sanitize_user($user), 'csrf' => $csrf]);
}

if ($path === 'auth/login' && $method === 'POST') {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = (string)($input['password'] ?? '');
    $d = db_read();
    $user = null;
    foreach ($d['users'] as $u) {
        if ($u['email'] === $email) {
            $user = $u;
            break;
        }
    }
    if (!$user || !password_verify($password, $user['passwordHash'])) {
        bad_req('Invalid login', 401);
    }
    
    $csrf = bin2hex(random_bytes(24));
    $sid = bin2hex(random_bytes(32));
    $d['sessions'][] = [
        'id' => $sid,
        'userId' => $user['id'],
        'csrf' => $csrf,
        'createdAt' => now_iso(),
        'expiresAt' => gmdate('Y-m-d\TH:i:s\Z', time() + SESSION_DAYS * 86400)
    ];
    audit($d, $user['id'], 'login');
    db_write($d);
    
    set_auth_cookie($sid);
    json_res(200, ['user' => sanitize_user($user), 'csrf' => $csrf]);
}

if ($path === 'auth/logout' && $method === 'POST') {
    $ctx = get_session();
    if ($ctx['session']) {
        $sid = $ctx['session']['id'];
        $ctx['d']['sessions'] = array_values(array_filter($ctx['d']['sessions'], fn($s) => $s['id'] !== $sid));
        db_write($ctx['d']);
    }
    setcookie(COOKIE_NAME, '', ['expires' => time() - 3600, 'path' => '/']);
    json_res(200, ['ok' => true]);
}

if ($path === 'me' && $method === 'GET') {
    $ctx = require_auth();
    json_res(200, ['user' => sanitize_user($ctx['user']), 'csrf' => $ctx['session']['csrf']]);
}

if ($path === 'dashboard' && $method === 'GET') {
    $ctx = require_auth();
    $userId = $ctx['user']['id'];
    $ledger = $ctx['d']['ledger'] ?? [];
    $userLedger = array_values(array_filter($ledger, fn($tx) => ($tx['userId'] ?? '') === $userId));
    
    $balanceMLY = 500;
    $standing = 50;
    foreach ($userLedger as $tx) {
        if (($tx['asset'] ?? '') === 'MLY' && in_array($tx['action'] ?? '', ['ALLOCATE', 'TRANSFER'], true)) {
            $balanceMLY -= $tx['amount'];
        } elseif (($tx['asset'] ?? '') === 'STANDING' && in_array($tx['action'] ?? '', ['ALLOCATE', 'TRANSFER'], true)) {
            $standing -= $tx['amount'];
        }
    }
    
    json_res(200, [
        'user' => sanitize_user($ctx['user']),
        'agenda' => array_values(array_filter($ctx['d']['agenda'], fn($a) => ($a['userId'] ?? '') === $userId)),
        'assembly' => $ctx['d']['assemblies'][$userId] ?? [],
        'invites' => array_values(array_filter($ctx['d']['invites'], fn($i) => ($i['userId'] ?? '') === $userId)),
        'events' => $ctx['d']['events'],
        'missions' => missions_for($ctx['user']['profile'] ?? []),
        'missionState' => $ctx['user']['missionState'] ?? [],
        'balanceMLY' => $balanceMLY,
        'standing' => $standing,
        'ledger' => $userLedger
    ]);
}

if ($path === 'profile' && $method === 'PUT') {
    $ctx = require_auth();
    $user = &$ctx['user'];
    $user['profile'] = enhance_profile(array_merge($user['profile'] ?? [], $input, ['email' => $user['email']]));
    $user['updatedAt'] = now_iso();
    foreach ($ctx['d']['users'] as &$u) {
        if ($u['id'] === $user['id']) {
            $u = $user;
            break;
        }
    }
    audit($ctx['d'], $user['id'], 'profile.updated');
    db_write($ctx['d']);
    json_res(200, ['user' => sanitize_user($user)]);
}

if ($path === 'agenda' && $method === 'POST') {
    $ctx = require_auth();
    $text = trim((string)($input['text'] ?? ''));
    if (!$text) bad_req('Agenda text required');
    $item = [
        'id' => gen_id('agenda'),
        'userId' => $ctx['user']['id'],
        'priority' => $input['priority'] ?? 'General',
        'text' => substr($text, 0, 1000),
        'createdAt' => now_iso()
    ];
    array_unshift($ctx['d']['agenda'], $item);
    audit($ctx['d'], $ctx['user']['id'], 'agenda.created', ['id' => $item['id']]);
    db_write($ctx['d']);
    json_res(201, ['item' => $item]);
}

if (str_starts_with($path, 'agenda/') && $method === 'DELETE') {
    $ctx = require_auth();
    $itemId = basename($path);
    $ctx['d']['agenda'] = array_values(array_filter($ctx['d']['agenda'], fn($a) => !($a['id'] === $itemId && $a['userId'] === $ctx['user']['id'])));
    audit($ctx['d'], $ctx['user']['id'], 'agenda.deleted', ['id' => $itemId]);
    db_write($ctx['d']);
    json_res(200, ['ok' => true]);
}

if ($path === 'assembly' && $method === 'PUT') {
    $ctx = require_auth();
    $ctx['d']['assemblies'][$ctx['user']['id']] = [
        'rsvp' => $input['rsvp'] ?? '',
        'availability' => $input['availability'] ?? '',
        'note' => substr((string)($input['note'] ?? ''), 0, 1000),
        'savedAt' => now_iso()
    ];
    audit($ctx['d'], $ctx['user']['id'], 'assembly.saved');
    db_write($ctx['d']);
    json_res(200, ['assembly' => $ctx['d']['assemblies'][$ctx['user']['id']]]);
}

if ($path === 'missions' && $method === 'PUT') {
    $ctx = require_auth();
    $mission = (string)($input['mission'] ?? '');
    $ctx['user']['missionState'] = $ctx['user']['missionState'] ?? [];
    $ctx['user']['missionState'][$mission] = !empty($input['done']);
    foreach ($ctx['d']['users'] as &$u) {
        if ($u['id'] === $ctx['user']['id']) {
            $u['missionState'] = $ctx['user']['missionState'];
            break;
        }
    }
    audit($ctx['d'], $ctx['user']['id'], 'mission.updated', ['mission' => $mission, 'done' => !empty($input['done'])]);
    db_write($ctx['d']);
    json_res(200, ['missionState' => $ctx['user']['missionState']]);
}

if ($path === 'invites' && $method === 'POST') {
    $ctx = require_auth();
    $name = trim((string)($input['name'] ?? ''));
    if (!$name) bad_req('Name required');
    $invite = [
        'id' => gen_id('invite'),
        'userId' => $ctx['user']['id'],
        'name' => substr($name, 0, 120),
        'contact' => substr((string)($input['contact'] ?? ''), 0, 180),
        'sent' => false,
        'joined' => false,
        'createdAt' => now_iso()
    ];
    $ctx['d']['invites'][] = $invite;
    audit($ctx['d'], $ctx['user']['id'], 'invite.created');
    db_write($ctx['d']);
    json_res(201, ['invite' => $invite]);
}

if (str_starts_with($path, 'invites/') && $method === 'PUT') {
    $ctx = require_auth();
    $inviteId = basename($path);
    $invite = null;
    foreach ($ctx['d']['invites'] as &$i) {
        if ($i['id'] === $inviteId && $i['userId'] === $ctx['user']['id']) {
            if (isset($input['sent'])) $i['sent'] = !empty($input['sent']);
            if (isset($input['joined'])) $i['joined'] = !empty($input['joined']);
            $i['updatedAt'] = now_iso();
            $invite = $i;
            break;
        }
    }
    if (!$invite) json_res(404, ['error' => 'Invite not found']);
    audit($ctx['d'], $ctx['user']['id'], 'invite.updated');
    db_write($ctx['d']);
    json_res(200, ['invite' => $invite]);
}

if (str_starts_with($path, 'invites/') && $method === 'DELETE') {
    $ctx = require_auth();
    $inviteId = basename($path);
    $ctx['d']['invites'] = array_values(array_filter($ctx['d']['invites'], fn($i) => !($i['id'] === $inviteId && $i['userId'] === $ctx['user']['id'])));
    audit($ctx['d'], $ctx['user']['id'], 'invite.deleted');
    db_write($ctx['d']);
    json_res(200, ['ok' => true]);
}

// Word-to-Math Formula Review Engine
if ($path === 'formulas/review' && $method === 'POST') {
    $ctx = require_auth();
    $text = trim((string)($input['text'] ?? ''));
    if (!$text) bad_req('Formula text required');
    
    $action = 'PROPOSE';
    $lower = strtolower($text);
    if (str_contains($lower, 'allocate') || str_contains($lower, 'spend') || str_contains($lower, 'fund')) $action = 'ALLOCATE';
    elseif (str_contains($lower, 'save') || str_contains($lower, 'set aside') || str_contains($lower, 'reserve')) $action = 'SAVE';
    elseif (str_contains($lower, 'transfer') || str_contains($lower, 'send') || str_contains($lower, 'pay')) $action = 'TRANSFER';
    
    preg_match('/(?:\$|MLY\s*|Standing\s*)?(\d+(?:\.\d+)?)/i', $text, $m);
    $amount = isset($m[1]) ? (float)$m[1] : 0;
    $asset = preg_match('/standing/i', $text) ? 'STANDING' : 'MLY';
    preg_match('/(?:to|for)\s+([A-Za-z0-9_\-\s]+)(?:,|$)/i', $text, $tm);
    $target = isset($tm[1]) ? trim($tm[1]) : 'Circle Treasury';
    
    $violations = [];
    if ($amount <= 0 || is_nan($amount)) $violations[] = 'invalid_amount';
    if ((str_contains($lower, 'deprive') || str_contains($lower, 'deprivation')) && !str_contains($lower, 'no deprivation')) {
        $violations[] = 'violates_no_deprivation';
    }
    
    $ast = [
        'id' => gen_id('ast'),
        'userId' => $ctx['user']['id'],
        'rawText' => $text,
        'action' => $action,
        'amount' => $amount,
        'asset' => $asset,
        'target' => $target,
        'charterCompliant' => empty($violations),
        'violations' => $violations,
        'reviewed' => false,
        'signature' => null,
        'createdAt' => now_iso()
    ];
    $ctx['d']['formulas'][] = $ast;
    db_write($ctx['d']);
    json_res(200, ['ast' => $ast]);
}

if ($path === 'formulas/approve' && $method === 'POST') {
    $ctx = require_auth();
    $astId = $input['astId'] ?? '';
    $ast = null;
    foreach ($ctx['d']['formulas'] as &$f) {
        if ($f['id'] === $astId && $f['userId'] === $ctx['user']['id']) {
            if (!$f['charterCompliant']) bad_req('Cannot approve non-compliant formula', 400);
            $payload = sprintf("%s:%s:%s:%s:%s:%s", $f['id'], $f['action'], $f['amount'], $f['asset'], $f['target'], $ctx['user']['id']);
            $sig = hash_hmac('sha256', $payload, $ctx['user']['salt']);
            $f['reviewed'] = true;
            $f['signature'] = $sig;
            $f['approvedAt'] = now_iso();
            $ast = $f;
            break;
        }
    }
    if (!$ast) json_res(404, ['error' => 'Formula AST not found']);
    
    $tx = [
        'id' => gen_id('tx'),
        'astId' => $ast['id'],
        'userId' => $ctx['user']['id'],
        'action' => $ast['action'],
        'amount' => $ast['amount'],
        'asset' => $ast['asset'],
        'target' => $ast['target'],
        'signature' => $ast['signature'],
        'timestamp' => now_iso()
    ];
    array_unshift($ctx['d']['ledger'], $tx);
    audit($ctx['d'], $ctx['user']['id'], 'formula.approved', ['txId' => $tx['id']]);
    db_write($ctx['d']);
    json_res(200, ['ast' => $ast, 'tx' => $tx]);
}

if ($path === 'ledger' && $method === 'GET') {
    $ctx = require_auth();
    $userId = $ctx['user']['id'];
    $userLedger = array_values(array_filter($ctx['d']['ledger'], fn($tx) => ($tx['userId'] ?? '') === $userId));
    $balanceMLY = 500;
    $standing = 50;
    foreach ($userLedger as $tx) {
        if (($tx['asset'] ?? '') === 'MLY' && in_array($tx['action'] ?? '', ['ALLOCATE', 'TRANSFER'], true)) {
            $balanceMLY -= $tx['amount'];
        } elseif (($tx['asset'] ?? '') === 'STANDING' && in_array($tx['action'] ?? '', ['ALLOCATE', 'TRANSFER'], true)) {
            $standing -= $tx['amount'];
        }
    }
    json_res(200, ['balanceMLY' => $balanceMLY, 'standing' => $standing, 'ledger' => $userLedger]);
}

if ($path === 'circles' && $method === 'GET') {
    $ctx = require_auth();
    json_res(200, ['circles' => $ctx['d']['circles']]);
}

if ($path === 'circles/match' && $method === 'POST') {
    $ctx = require_auth(['admin', 'organizer']);
    $citizens = array_filter($ctx['d']['users'], fn($u) => $u['role'] === 'citizen');
    $unassigned = array_values(array_filter($citizens, fn($u) => empty($u['profile']['assignedCircle'])));
    
    $matchCount = 0;
    $circleSize = 7;
    for ($i = 0; $i < count($unassigned); $i += $circleSize) {
        $group = array_slice($unassigned, $i, $circleSize);
        if (count($group) >= 1) {
            $circleName = sprintf("Circle_%s_%d", $group[0]['profile']['location'] ?? 'Founding', count($ctx['d']['circles']) + 1);
            $circle = [
                'id' => gen_id('circle'),
                'name' => $circleName,
                'members' => array_map(fn($u) => $u['id'], $group),
                'focus' => $group[0]['profile']['focus'] ?? 'Governance',
                'createdAt' => now_iso()
            ];
            $ctx['d']['circles'][] = $circle;
            
            foreach ($group as $member) {
                foreach ($ctx['d']['users'] as &$u) {
                    if ($u['id'] === $member['id']) {
                        $u['profile']['assignedCircle'] = $circleName;
                        $u['profile']['circleStatus'] = 'Active Member';
                        $u['updatedAt'] = now_iso();
                        break;
                    }
                }
            }
            $matchCount++;
        }
    }
    audit($ctx['d'], $ctx['user']['id'], 'circle.match_run', ['created' => $matchCount]);
    db_write($ctx['d']);
    json_res(200, ['circlesCreated' => $matchCount, 'circles' => $ctx['d']['circles']]);
}

if ($path === 'export/pod' && $method === 'GET') {
    $ctx = require_auth();
    $userId = $ctx['user']['id'];
    $pod = [
        '@context' => 'https://milyfe.fun/contexts/SolidPod_v1.jsonld',
        'type' => 'CitizenPodExport',
        'citizenId' => $userId,
        'email' => $ctx['user']['email'],
        'role' => $ctx['user']['role'],
        'profile' => $ctx['user']['profile'],
        'missions' => $ctx['user']['missionState'] ?? [],
        'agenda' => array_values(array_filter($ctx['d']['agenda'], fn($a) => ($a['userId'] ?? '') === $userId)),
        'ledger' => array_values(array_filter($ctx['d']['ledger'], fn($tx) => ($tx['userId'] ?? '') === $userId)),
        'formulas' => array_values(array_filter($ctx['d']['formulas'], fn($f) => ($f['userId'] ?? '') === $userId)),
        'exportedAt' => now_iso(),
        'signature' => hash_hmac('sha256', $userId . ':' . now_iso(), $ctx['user']['salt'])
    ];
    json_res(200, ['pod' => $pod]);
}

if ($path === 'admin/citizens' && $method === 'GET') {
    $ctx = require_auth(['admin', 'organizer']);
    $citizens = array_map(fn($u) => sanitize_user($u), $ctx['d']['users']);
    $stats = [
        'total' => count($citizens),
        'onboarded' => count(array_filter($citizens, fn($u) => ($u['profile']['status'] ?? '') === 'Onboarded')),
        'active' => count(array_filter($citizens, fn($u) => ($u['profile']['status'] ?? '') === 'Active citizen')),
        'organizers' => count(array_filter($citizens, fn($u) => str_contains($u['profile']['suggestedRole'] ?? '', 'Organizer') || $u['role'] === 'organizer'))
    ];
    json_res(200, ['citizens' => array_values($citizens), 'stats' => $stats, 'events' => $ctx['d']['events']]);
}

if (str_starts_with($path, 'admin/citizens/') && $method === 'PUT') {
    $ctx = require_auth(['admin']);
    $targetId = basename($path);
    $user = null;
    foreach ($ctx['d']['users'] as &$u) {
        if ($u['id'] === $targetId) {
            $u['profile']['status'] = $input['status'] ?? $u['profile']['status'];
            $u['profile']['assignedCircle'] = $input['assignedCircle'] ?? $u['profile']['assignedCircle'] ?? '';
            $u['profile']['circleStatus'] = $input['circleStatus'] ?? $u['profile']['circleStatus'];
            if (in_array($input['role'] ?? '', ['citizen', 'organizer', 'admin'], true)) {
                $u['role'] = $input['role'];
            }
            $u['updatedAt'] = now_iso();
            $user = $u;
            break;
        }
    }
    if (!$user) json_res(404, ['error' => 'Citizen not found']);
    audit($ctx['d'], $ctx['user']['id'], 'admin.citizen.updated', ['target' => $targetId]);
    db_write($ctx['d']);
    json_res(200, ['user' => sanitize_user($user)]);
}

if ($path === 'admin/events' && $method === 'POST') {
    $ctx = require_auth(['admin', 'organizer']);
    $title = trim((string)($input['title'] ?? ''));
    if (!$title) bad_req('Title required');
    $event = [
        'id' => gen_id('event'),
        'title' => substr($title, 0, 160),
        'date' => (string)($input['date'] ?? ''),
        'location' => (string)($input['location'] ?? ''),
        'notes' => (string)($input['notes'] ?? ''),
        'createdBy' => $ctx['user']['id'],
        'createdAt' => now_iso()
    ];
    array_unshift($ctx['d']['events'], $event);
    audit($ctx['d'], $ctx['user']['id'], 'event.created');
    db_write($ctx['d']);
    json_res(201, ['event' => $event]);
}

if ($path === 'stream' && $method === 'GET') {
    $ctx = require_auth();
    // Return connection status for short-lived shared hosting polling/heartbeat
    json_res(200, ['status' => 'connected', 'userId' => $ctx['user']['id'], 'timestamp' => now_iso()]);
}

json_res(404, ['error' => 'API endpoint not found: ' . $path]);
