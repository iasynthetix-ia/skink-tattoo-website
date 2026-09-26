<?php
session_start();

// ── Configuración ─────────────────────────────────────────────────────────────
define('ADMIN_PASS',   'skink2026');               // ← CAMBIA ESTO antes de subir a producción
define('PROMO_JSON',   __DIR__ . '/../promo.json');
define('UPLOADS_DIR',  __DIR__ . '/../resources/promo-uploads/');
define('UPLOADS_PATH', 'resources/promo-uploads/');
define('MAX_SIZE',     8 * 1024 * 1024);            // 8 MB
define('ALLOWED_EXT',  ['jpg', 'jpeg', 'png', 'webp']);

// ── Auth ──────────────────────────────────────────────────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'login') {
    if (trim($_POST['password'] ?? '') === ADMIN_PASS) {
        $_SESSION['skink_auth'] = true;
    } else {
        $loginError = 'Contraseña incorrecta.';
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

$auth = !empty($_SESSION['skink_auth']);

// ── Cargar promo actual ───────────────────────────────────────────────────────
$promo = [];
if (file_exists(PROMO_JSON)) {
    $promo = json_decode(file_get_contents(PROMO_JSON), true) ?? [];
}

// ── Guardar cambios ───────────────────────────────────────────────────────────
$msg      = '';
$msgType  = 'success';

if ($auth && isset($_POST['action']) && $_POST['action'] === 'save') {
    $newPromo = $promo;
    $newPromo['title']     = trim($_POST['title']     ?? '');
    $newPromo['sub']       = trim($_POST['sub']       ?? '');
    $newPromo['btnText']   = trim($_POST['btnText']   ?? '');
    $newPromo['waMessage'] = trim($_POST['waMessage'] ?? '');

    // Auto-traducir al inglés si el texto cambió o no existe traducción
    $titleChanged   = ($newPromo['title']   !== ($promo['title']   ?? ''));
    $subChanged     = ($newPromo['sub']     !== ($promo['sub']     ?? ''));
    $btnTextChanged = ($newPromo['btnText'] !== ($promo['btnText'] ?? ''));

    if ($titleChanged || empty($promo['title_en'])) {
        $newPromo['title_en'] = autoTranslateToEn($newPromo['title']);
    } else {
        $newPromo['title_en'] = $promo['title_en'] ?? '';
    }
    if ($subChanged || empty($promo['sub_en'])) {
        $newPromo['sub_en'] = autoTranslateToEn($newPromo['sub']);
    } else {
        $newPromo['sub_en'] = $promo['sub_en'] ?? '';
    }
    if ($btnTextChanged || empty($promo['btnText_en'])) {
        $newPromo['btnText_en'] = autoTranslateToEn($newPromo['btnText']);
    } else {
        $newPromo['btnText_en'] = $promo['btnText_en'] ?? '';
    }

    // ── Eliminar imagen si se marcó el checkbox ──────────────────────────────
    if (!empty($_POST['clear_image'])) {
        $oldImage = $promo['image'] ?? '';
        if (strpos($oldImage, UPLOADS_PATH) === 0) {
            $oldFile = __DIR__ . '/../' . $oldImage;
            if (file_exists($oldFile)) unlink($oldFile);
        }
        $newPromo['image'] = '';
    }

    // ── Subida de imagen ─────────────────────────────────────────────────────
    if (empty($_POST['clear_image']) && !empty($_FILES['image']['name'])) {
        $file    = $_FILES['image'];
        $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $errCode = $file['error'];

        if ($errCode !== UPLOAD_ERR_OK) {
            $msg     = 'Error al subir la imagen (código ' . $errCode . ').';
            $msgType = 'error';
        } elseif ($file['size'] > MAX_SIZE) {
            $msg     = 'La imagen supera el límite de 8 MB.';
            $msgType = 'error';
        } elseif (!in_array($ext, ALLOWED_EXT, true)) {
            $msg     = 'Formato no permitido. Usa JPG, PNG o WebP.';
            $msgType = 'error';
        } else {
            if (!is_dir(UPLOADS_DIR)) {
                mkdir(UPLOADS_DIR, 0755, true);
            }

            $filename = 'promo_' . time() . '.' . $ext;
            $dest     = UPLOADS_DIR . $filename;

            if (move_uploaded_file($file['tmp_name'], $dest)) {
                // Limpiar imagen anterior si fue subida desde el admin
                $oldImage = $promo['image'] ?? '';
                if (strpos($oldImage, UPLOADS_PATH) === 0) {
                    $oldFile = __DIR__ . '/../' . $oldImage;
                    if (file_exists($oldFile)) {
                        unlink($oldFile);
                    }
                }
                $newPromo['image'] = UPLOADS_PATH . $filename;
            } else {
                $msg     = 'No se pudo guardar la imagen en el servidor.';
                $msgType = 'error';
            }
        }
    }

    // Solo guardar si no hubo error de imagen
    if ($msgType !== 'error') {
        $saved = file_put_contents(
            PROMO_JSON,
            json_encode($newPromo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        );

        if ($saved !== false) {
            $promo = $newPromo;
            $msg   = '✅ Promoción actualizada correctamente.';
        } else {
            $msg     = 'No se pudo escribir promo.json. Verifica permisos del servidor.';
            $msgType = 'error';
        }
    }
}

// ── Auto-traducción ES → EN via MyMemory ─────────────────────────────────────
function autoTranslateToEn($text) {
    if (empty(trim($text))) return '';
    $url  = 'https://api.mymemory.translated.net/get?q=' . urlencode($text) . '&langpair=es|en';
    $ctx  = stream_context_create(['http' => ['timeout' => 5]]);
    $resp = @file_get_contents($url, false, $ctx);
    if (!$resp) return '';
    $data = json_decode($resp, true);
    return $data['responseData']['translatedText'] ?? '';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function h($s) { return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8'); }
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Skink Tattoo House</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --black:   #000;
      --dark:    #111;
      --card:    #1a1a1a;
      --border:  #2e2e2e;
      --white:   #fff;
      --muted:   rgba(255,255,255,.45);
      --accent:  #0071e3;
      --red:     #ff3b30;
      --green:   #30d158;
      --radius:  12px;
      --font:    -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    body {
      font-family: var(--font);
      background: var(--dark);
      color: var(--white);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 16px 80px;
    }

    /* ── Login ── */
    .login-wrap {
      width: 100%;
      max-width: 360px;
      margin-top: 80px;
    }

    .login-wrap h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .login-wrap p {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 28px;
    }

    /* ── Admin layout ── */
    .admin-wrap {
      width: 100%;
      max-width: 700px;
    }

    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .admin-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .admin-header span {
      font-size: 0.78rem;
      color: var(--muted);
    }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px;
      margin-bottom: 20px;
    }

    .card h2 {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .07em;
      color: var(--muted);
      margin-bottom: 20px;
    }

    /* ── Preview actual ── */
    .current-preview {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      display: block;
      margin-bottom: 10px;
      border: 1px solid var(--border);
    }

    .current-path {
      font-size: 0.72rem;
      color: var(--muted);
      word-break: break-all;
    }

    /* ── Fields ── */
    .field { margin-bottom: 18px; }

    label {
      display: block;
      font-size: 0.78rem;
      font-weight: 500;
      color: rgba(255,255,255,.7);
      margin-bottom: 6px;
    }

    input[type="text"],
    input[type="password"],
    textarea {
      width: 100%;
      background: #222;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--white);
      font-family: var(--font);
      font-size: 0.9rem;
      padding: 11px 14px;
      outline: none;
      transition: border-color .2s;
      resize: vertical;
    }

    input[type="text"]:focus,
    input[type="password"]:focus,
    textarea:focus {
      border-color: var(--accent);
    }

    .hint {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 5px;
    }

    /* ── File upload ── */
    .file-drop {
      border: 2px dashed var(--border);
      border-radius: 10px;
      padding: 28px;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      position: relative;
    }

    .file-drop:hover { border-color: var(--accent); background: rgba(0,113,227,.04); }

    .file-drop input[type="file"] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }

    .file-drop .icon { font-size: 2rem; margin-bottom: 8px; }
    .file-drop p    { font-size: 0.85rem; color: var(--muted); }
    .file-drop strong { color: var(--accent); }

    #file-name {
      margin-top: 10px;
      font-size: 0.78rem;
      color: var(--accent);
      min-height: 1.2em;
    }

    #upload-preview-wrap {
      display: none;
      margin-top: 16px;
    }

    #upload-preview-wrap p {
      font-size: 0.72rem;
      color: var(--muted);
      margin-bottom: 6px;
    }

    #upload-preview {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      display: block;
      border: 1px solid var(--accent);
    }

    /* ── Buttons ── */
    .btn-primary {
      width: 100%;
      background: var(--accent);
      color: var(--white);
      border: none;
      border-radius: 980px;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: var(--font);
      padding: 14px;
      cursor: pointer;
      transition: background .2s;
    }

    .btn-primary:hover { background: #0077ed; }

    .btn-logout {
      background: none;
      border: 1px solid var(--border);
      color: var(--muted);
      border-radius: 980px;
      font-size: 0.75rem;
      font-family: var(--font);
      padding: 6px 14px;
      cursor: pointer;
      text-decoration: none;
      transition: color .2s, border-color .2s;
    }

    .btn-logout:hover { color: var(--white); border-color: rgba(255,255,255,.4); }

    /* ── Alert ── */
    .alert {
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 0.88rem;
      margin-bottom: 20px;
    }

    .alert-success { background: rgba(48,209,88,.12); border: 1px solid rgba(48,209,88,.3); color: var(--green); }
    .alert-error   { background: rgba(255,59,48,.12);  border: 1px solid rgba(255,59,48,.3);  color: var(--red); }

    /* ── Login error ── */
    .login-error {
      background: rgba(255,59,48,.12);
      border: 1px solid rgba(255,59,48,.3);
      color: var(--red);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>

<?php if (!$auth): ?>
<!-- ═══════════ LOGIN ═══════════ -->
<div class="login-wrap">
  <h1>Skink Admin</h1>
  <p>Panel de gestión de promociones</p>

  <?php if (!empty($loginError)): ?>
    <div class="login-error"><?= h($loginError) ?></div>
  <?php endif; ?>

  <form method="POST">
    <input type="hidden" name="action" value="login">
    <div class="field">
      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" autofocus autocomplete="current-password">
    </div>
    <button type="submit" class="btn-primary">Entrar</button>
  </form>
</div>

<?php else: ?>
<!-- ═══════════ ADMIN ═══════════ -->
<div class="admin-wrap">

  <div class="admin-header">
    <div>
      <h1>Gestionar Promoción</h1>
      <span>skinktattohouse.com</span>
    </div>
    <a href="?logout=1" class="btn-logout">Cerrar sesión</a>
  </div>

  <?php if ($msg): ?>
    <div class="alert alert-<?= $msgType === 'error' ? 'error' : 'success' ?>">
      <?= h($msg) ?>
    </div>
  <?php endif; ?>

  <form method="POST" enctype="multipart/form-data">
    <input type="hidden" name="action" value="save">

    <!-- Imagen actual -->
    <div class="card">
      <h2>Imagen actual</h2>
      <?php
        $imgSrc = h($promo['image'] ?? '');
        $imgUrl = '../' . $imgSrc;
      ?>
      <img src="<?= $imgUrl ?>" alt="Promoción actual" class="current-preview"
           onerror="this.style.display='none'">
      <p class="current-path"><?= $imgSrc ?: 'Sin imagen' ?></p>
      <?php if ($imgSrc): ?>
      <label class="clear-label" style="display:flex;align-items:center;gap:8px;margin-top:14px;cursor:pointer;">
        <input type="checkbox" name="clear_image" value="1" id="clear_image"
               style="width:16px;height:16px;accent-color:var(--red);cursor:pointer;">
        <span style="font-size:0.82rem;color:var(--red);">Eliminar imagen actual (la sección se ocultará si los campos también están vacíos)</span>
      </label>
      <?php endif; ?>
    </div>

    <!-- Nueva imagen -->
    <div class="card" id="new-image-card">
      <h2>Reemplazar imagen</h2>
      <div class="file-drop" id="file-drop">
        <input type="file" name="image" id="image-input"
               accept=".jpg,.jpeg,.png,.webp" onchange="showFileName(this)">
        <div class="icon">🖼</div>
        <p>Arrastra una imagen aquí o <strong>haz clic para buscar</strong></p>
        <p style="font-size:.72rem;margin-top:4px">JPG, PNG, WebP · máx. 8 MB</p>
        <div id="file-name"></div>
      </div>
      <div id="upload-preview-wrap">
        <p>Vista previa de la imagen seleccionada:</p>
        <img id="upload-preview" src="" alt="Vista previa">
      </div>
      <p class="hint" style="margin-top:10px">
        La imagen anterior (si fue subida desde aquí) se eliminará automáticamente al guardar.
      </p>
    </div>

    <!-- Textos -->
    <div class="card">
      <h2>Textos de la promoción</h2>

      <div class="field">
        <label for="title">Título</label>
        <input type="text" id="title" name="title"
               value="<?= h($promo['title'] ?? '') ?>"
               placeholder="ej. Microrealismo">
        <p class="hint">El nombre grande que aparece en la sección (ej. «Microrealismo»)</p>
      </div>

      <div class="field">
        <label for="sub">Descripción</label>
        <textarea id="sub" name="sub" rows="3"
                  placeholder="ej. Detalle fotográfico.&#10;A escala íntima."><?= h($promo['sub'] ?? '') ?></textarea>
        <p class="hint">Usa Enter para saltos de línea.</p>
      </div>

      <div class="field">
        <label for="btnText">Texto del botón</label>
        <input type="text" id="btnText" name="btnText"
               value="<?= h($promo['btnText'] ?? '') ?>"
               placeholder="ej. Consultar promoción">
      </div>

      <div class="field">
        <label for="waMessage">Mensaje de WhatsApp (al hacer clic en el botón)</label>
        <textarea id="waMessage" name="waMessage" rows="3"
                  placeholder="ej. Hola! Me interesa la promo de Microrealismo 🎨"><?= h($promo['waMessage'] ?? '') ?></textarea>
      </div>
    </div>

    <button type="submit" class="btn-primary">Guardar cambios</button>
  </form>

</div>
<?php endif; ?>

<script>
function showFileName(input) {
  const file       = input.files[0];
  const nameEl     = document.getElementById('file-name');
  const previewWrap = document.getElementById('upload-preview-wrap');
  const previewImg  = document.getElementById('upload-preview');

  if (!file) {
    nameEl.textContent = '';
    previewWrap.style.display = 'none';
    return;
  }

  nameEl.textContent = '📎 ' + file.name;

  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    previewWrap.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
</script>

</body>
</html>
