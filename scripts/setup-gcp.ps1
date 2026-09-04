<#
.SYNOPSIS
    Google Cloud Setup Script for Speed-to-Lead & Google Gemini Flash Deployment (PowerShell)
#>

$ErrorActionPreference = "Stop"

$ProjectId = $env:GCP_PROJECT_ID
if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project 2>$null)
}

if (-not $ProjectId) {
    Write-Error "No active GCP project found. Run 'gcloud config set project <PROJECT_ID>' or set `$env:GCP_PROJECT_ID."
    exit 1
}

$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$ArtifactRepo = if ($env:ARTIFACT_REPO_NAME) { $env:ARTIFACT_REPO_NAME } else { "speed-to-lead" }
$ServiceName = if ($env:CLOUD_RUN_SERVICE_NAME) { $env:CLOUD_RUN_SERVICE_NAME } else { "speed-to-lead" }
$DeployerSa = "github-actions-deployer"
$RuntimeSa = "speed-to-lead-runtime"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Configuring GCP Resources for: $ProjectId" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Enable Required APIs
Write-Host "[1/6] Enabling Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  secretmanager.googleapis.com `
  aiplatform.googleapis.com `
  generativelanguage.googleapis.com `
  iam.googleapis.com `
  cloudbuild.googleapis.com `
  --project=$ProjectId

# 2. Create Artifact Registry Repository
Write-Host "[2/6] Checking/Creating Artifact Registry repository..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories describe $ArtifactRepo --location=$Region --project=$ProjectId 2>$null
if (-not $repoExists) {
    gcloud artifacts repositories create $ArtifactRepo `
      --repository-format=docker `
      --location=$Region `
      --description="Docker repository for Speed-to-Lead Gemini Flash service" `
      --project=$ProjectId
    Write-Host "Created Artifact Registry repository: $ArtifactRepo" -ForegroundColor Green
} else {
    Write-Host "Artifact Registry repository '$ArtifactRepo' already exists." -ForegroundColor Gray
}

# 3. Create Runtime Service Account
Write-Host "[3/6] Setting up Cloud Run Runtime Service Account..." -ForegroundColor Yellow
$RuntimeEmail = "${RuntimeSa}@${ProjectId}.iam.gserviceaccount.com"
$runtimeExists = gcloud iam service-accounts describe $RuntimeEmail --project=$ProjectId 2>$null
if (-not $runtimeExists) {
    gcloud iam service-accounts create $RuntimeSa `
      --display-name="Speed to Lead Cloud Run Runtime SA" `
      --project=$ProjectId
    Write-Host "Created Runtime Service Account: $RuntimeEmail" -ForegroundColor Green
}

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:${RuntimeEmail}" `
  --role="roles/secretmanager.secretAccessor" --quiet

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:${RuntimeEmail}" `
  --role="roles/aiplatform.user" --quiet

# 4. Create CI/CD Deployer Service Account
Write-Host "[4/6] Setting up CI/CD Deployer Service Account..." -ForegroundColor Yellow
$DeployerEmail = "${DeployerSa}@${ProjectId}.iam.gserviceaccount.com"
$deployerExists = gcloud iam service-accounts describe $DeployerEmail --project=$ProjectId 2>$null
if (-not $deployerExists) {
    gcloud iam service-accounts create $DeployerSa `
      --display-name="GitHub Actions Deployer" `
      --project=$ProjectId
    Write-Host "Created Deployer Service Account: $DeployerEmail" -ForegroundColor Green
}

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:${DeployerEmail}" `
  --role="roles/run.admin" --quiet

gcloud projects add-iam-policy-binding $ProjectId `
  --member="serviceAccount:${DeployerEmail}" `
  --role="roles/artifactregistry.writer" --quiet

gcloud iam service-accounts add-iam-policy-binding $RuntimeEmail `
  --member="serviceAccount:${DeployerEmail}" `
  --role="roles/iam.serviceAccountUser" `
  --project=$ProjectId --quiet

# 5. Setup Secret Manager Secrets
Write-Host "[5/6] Setting up Secret Manager placeholders..." -ForegroundColor Yellow
foreach ($secret in @("GEMINI_API_KEY", "CALLE_API_KEY")) {
    $secretExists = gcloud secrets describe $secret --project=$ProjectId 2>$null
    if (-not $secretExists) {
        gcloud secrets create $secret --replication-policy="automatic" --project=$ProjectId
        "placeholder_replace_with_real_key" | gcloud secrets versions add $secret --data-file=- --project=$ProjectId
        Write-Host "Created secret: $secret" -ForegroundColor Green
    } else {
        Write-Host "Secret '$secret' already exists." -ForegroundColor Gray
    }
}

# 6. Generate Key for GitHub Secrets
Write-Host "[6/6] Generating credentials JSON key for GitHub Actions..." -ForegroundColor Yellow
$KeyFile = "github-actions-sa-key.json"
gcloud iam service-accounts keys create $KeyFile `
  --iam-account=$DeployerEmail `
  --project=$ProjectId

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " GCP SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Add the following Secrets in GitHub: Settings -> Secrets and variables -> Actions"
Write-Host ""
Write-Host "1. GCP_PROJECT_ID: $ProjectId"
Write-Host "2. GCP_SA_KEY: (Contents of $KeyFile)"
Write-Host "3. Update your real GEMINI_API_KEY in GCP Secret Manager:"
Write-Host "   Get-Content key.txt | gcloud secrets versions add GEMINI_API_KEY --data-file=-"
Write-Host ""
Write-Host "IMPORTANT: Keep $KeyFile secure and delete it after adding to GitHub Secrets!" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Green
