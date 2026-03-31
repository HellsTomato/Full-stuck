# push-nonlab.ps1
param(
  [string]$Message = "chore: non-lab changes",
  [switch]$NoConfirm
)

# Список путей, относящихся к ЛР (не пушим их). Отредактируйте при необходимости.
$exclude = @(
  "backend/src/main/resources/application.properties",
  "backend/src/main/java/ru/mtuci/sportapp/backend/controller/SeoController.java",
  "backend/src/main/java/ru/mtuci/sportapp/backend/service/ExternalWeatherService.java",
  "backend/src/main/java/ru/mtuci/sportapp/backend/controller/ExternalWeatherController.java",
  "backend/src/main/java/ru/mtuci/sportapp/backend/security/SecurityConfig.java",
  "frontend/index.html",
  "frontend/src/routes/AthleteProfile.tsx",
  "frontend/src/routes/Dashboard.tsx",
  "frontend/src/components/Avatar.tsx"
)

# Проверка: запуск из корня репозитория
if (-not (Test-Path -Path ".git")) {
  Write-Error "Запустите скрипт из корня репозитория (папка с .git)."
  exit 1
}

# Получаем изменённые/неотслеживаемые файлы
$porcelain = git status --porcelain
if ($LASTEXITCODE -ne 0) {
  Write-Error "git status failed. Убедитесь, что git установлен и вы находитесь в репозитории."
  exit 1
}

$files = @()
foreach ($line in $porcelain) {
  $ln = $line.Trim()
  if ($ln -eq '') { continue }
  if ($ln.Length -lt 4) { continue }
  $pathPart = $ln.Substring(3)
  if ($pathPart -match "->") {
    $parts = $pathPart -split "->"
    $path = $parts[-1].Trim()
  } else {
    $path = $pathPart.Trim()
  }
  $files += $path
}
$files = $files | Sort-Object -Unique

# Фильтруем — убираем файлы, относящиеся к ЛР
$toCommit = $files | Where-Object {
  $f = $_
  $skip = $false
  foreach ($ex in $exclude) {
    if ($f -eq $ex -or $f.StartsWith($ex)) { $skip = $true; break }
  }
  -not $skip
}

if (-not $toCommit -or $toCommit.Count -eq 0) {
  Write-Host "Нет файлов для коммита после исключения лабы."
  exit 0
}

Write-Host "Файлы, которые будут закоммичены:"
$toCommit | ForEach-Object { Write-Host "  - $_" }

if (-not $NoConfirm) {
  $ans = Read-Host "Продолжить add/commit/push этих файлов? (y/N)"
  if ($ans.ToLower() -ne 'y') { Write-Host "Отмена."; exit 0 }
}

# Stage выбранные файлы
foreach ($f in $toCommit) {
  git add -- "$f"
  if ($LASTEXITCODE -ne 0) { Write-Error "git add failed for $f"; exit 1 }
}

# Commit и push
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Error "git commit failed (возможно, нет изменений для коммита)."
  exit 1
}

$branch = git rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0) { Write-Error "Не удалось определить текущую ветку"; exit 1 }
$branch = $branch.Trim()

git push origin $branch
if ($LASTEXITCODE -ne 0) { Write-Error "git push не удался"; exit 1 }

Write-Host "Готово. Коммит и пуш выполнены в ветку $branch."