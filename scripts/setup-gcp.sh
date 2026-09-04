#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Setup Script for Speed-to-Lead & Google Gemini Flash Deployment
# ==============================================================================
set -euo pipefail

# 1. Configuration (override with environment variables if desired)
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO="${ARTIFACT_REPO_NAME:-speed-to-lead}"
SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-speed-to-lead}"
DEPLOYER_SA="github-actions-deployer"
RUNTIME_SA="speed-to-lead-runtime"

if [ -z "${PROJECT_ID}" ]; then
  echo "Error: No active GCP project found. Run 'gcloud config set project <PROJECT_ID>' or set GCP_PROJECT_ID."
  exit 1
fi

echo "============================================================"
echo "Configuring GCP Resources for: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "============================================================"

# 2. Enable Required APIs
echo "[1/6] Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  iam.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"

# 3. Create Artifact Registry Repository (Docker format)
echo "[2/6] Checking/Creating Artifact Registry repository..."
if ! gcloud artifacts repositories describe "${ARTIFACT_REPO}" --location="${REGION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${ARTIFACT_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for Speed-to-Lead Gemini Flash service" \
    --project="${PROJECT_ID}"
  echo "Created Artifact Registry repository: ${ARTIFACT_REPO}"
else
  echo "Artifact Registry repository '${ARTIFACT_REPO}' already exists."
fi

# 4. Create Runtime Service Account (used by the Cloud Run service)
echo "[3/6] Setting up Cloud Run Runtime Service Account..."
RUNTIME_EMAIL="${RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "${RUNTIME_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${RUNTIME_SA}" \
    --display-name="Speed to Lead Cloud Run Runtime SA" \
    --project="${PROJECT_ID}"
  echo "Created Runtime Service Account: ${RUNTIME_EMAIL}"
fi

# Grant Secret Manager Accessor & Vertex AI User to Runtime SA
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" --quiet

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_EMAIL}" \
  --role="roles/aiplatform.user" --quiet

# 5. Create CI/CD Deployer Service Account (used by GitHub Actions)
echo "[4/6] Setting up CI/CD Deployer Service Account..."
DEPLOYER_EMAIL="${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "${DEPLOYER_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${DEPLOYER_SA}" \
    --display-name="GitHub Actions Deployer" \
    --project="${PROJECT_ID}"
  echo "Created Deployer Service Account: ${DEPLOYER_EMAIL}"
fi

# Grant deployer permissions
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/run.admin" --quiet

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/artifactregistry.writer" --quiet

gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_EMAIL}" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --project="${PROJECT_ID}" --quiet

# 6. Setup Secret Manager Secrets
echo "[5/6] Setting up Secret Manager placeholders..."
for SECRET_NAME in "GEMINI_API_KEY" "CALLE_API_KEY"; do
  if ! gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud secrets create "${SECRET_NAME}" \
      --replication-policy="automatic" \
      --project="${PROJECT_ID}"
    echo "Created secret: ${SECRET_NAME}"
    echo -n "placeholder_replace_with_real_key" | gcloud secrets versions add "${SECRET_NAME}" --data-file=- --project="${PROJECT_ID}"
  else
    echo "Secret '${SECRET_NAME}' already exists."
  fi
done

# 7. Generate Key for GitHub Secrets
echo "[6/6] Generating credentials JSON key for GitHub Actions..."
KEY_FILE="github-actions-sa-key.json"
gcloud iam service-accounts keys create "${KEY_FILE}" \
  --iam-account="${DEPLOYER_EMAIL}" \
  --project="${PROJECT_ID}"

echo ""
echo "============================================================"
echo " GCP SETUP COMPLETE!"
echo "============================================================"
echo "Add the following Secrets in GitHub: Settings -> Secrets and variables -> Actions"
echo ""
echo "1. GCP_PROJECT_ID: ${PROJECT_ID}"
echo "2. GCP_SA_KEY: (Contents of $(pwd)/${KEY_FILE})"
echo "3. Update your real GEMINI_API_KEY in GCP Secret Manager:"
echo "   gcloud secrets versions add GEMINI_API_KEY --data-file=/path/to/key.txt"
echo ""
echo "IMPORTANT: Keep ${KEY_FILE} secure and delete it after adding to GitHub Secrets!"
echo "============================================================"
