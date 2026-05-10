# 🚀 sample-ci-cd-app

A production-grade CI/CD pipeline for a Node.js application using **Jenkins**, **GitHub Actions**, **Docker**, **ArgoCD**, and **Google Kubernetes Engine (GKE)** — implementing the **GitOps** approach for automated deployments.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [CI Pipeline — Jenkins](#-ci-pipeline--jenkins)
- [CI Pipeline — GitHub Actions](#-ci-pipeline--github-actions)
- [CD Pipeline — ArgoCD + GKE](#-cd-pipeline--argocd--gke)
- [Infrastructure as Code — Terraform](#-infrastructure-as-code--terraform)
- [Getting Started](#-getting-started)
- [How to Run Locally](#-how-to-run-locally)

---

## 📌 Project Overview

This project demonstrates a complete end-to-end CI/CD pipeline where:

- Every **code push to GitHub** automatically triggers a CI pipeline
- The CI pipeline **builds a Docker image** and pushes it to a container registry
- The **Kubernetes manifest is automatically updated** with the new image tag
- **ArgoCD detects the manifest change** and deploys to GKE with zero downtime
- The app is **live and accessible** via a public External IP

---

## 🏗️ Architecture

```
Developer
    │
    │  git push to main
    ▼
GitHub Repository
    ├── Webhook ──────────────────────────────────────────┐
    │                                                      │
    ▼                                                      ▼
Jenkins (CI)                                    GitHub Actions (CI)
    │                                                      │
    │  docker build + push                    docker build + push
    ▼                                                      ▼
Docker Hub                                          ghcr.io
(kattanaresh/sample-ci-cd-app)        (ghcr.io/nareshkatta97/sample-ci-cd-app)
    │                                                      │
    └──────────────────────┬───────────────────────────────┘
                           │
                 Update k8s/deployment.yaml
                 (new image tag committed to GitHub)
                           │
                           ▼
                       ArgoCD
                (watches GitHub repo every 3 min)
                           │
                    Auto-sync on change
                           │
                           ▼
                  GKE Kubernetes Cluster
                  (2-node, us-central1-a)
                    ├── Pod 1 (new image)
                    └── Pod 2 (new image)
                           │
                    LoadBalancer Service
                           │
                           ▼
                   External IP → User
```

---

## 🛠️ Tech Stack

| Category | Tool | Purpose |
|---|---|---|
| Application | Node.js | Sample web application |
| Containerization | Docker | Build and package the app |
| Source Control | GitHub | Code + K8s manifest repository |
| CI Tool 1 | Jenkins | Build, push, update manifest |
| CI Tool 2 | GitHub Actions | Alternative CI pipeline |
| Registry 1 | Docker Hub | Docker image storage (Jenkins) |
| Registry 2 | ghcr.io | GitHub Container Registry (GH Actions) |
| CD Tool | ArgoCD | GitOps-based continuous delivery |
| Orchestration | Kubernetes (GKE) | Container orchestration |
| Cloud | Google Cloud Platform | Managed Kubernetes cluster |
| IaC | Terraform | Provision GKE cluster as code |

---

## 📁 Repository Structure

```
sample-ci-cd-app/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions workflow
├── app/
│   ├── server.js           # Node.js application
│   └── package.json        # Dependencies
├── k8s/
│   └── deployment.yaml     # Kubernetes Deployment + Service
├── Dockerfile              # Container image definition
├── Jenkinsfile             # Jenkins declarative pipeline
└── README.md
```

---

## ⚙️ CI Pipeline — Jenkins

### Pipeline Stages

```
Checkout → Build Docker Image → Push to Docker Hub → Update K8s Manifest → Cleanup
```

### Jenkinsfile Stages Explained

| Stage | What it does |
|---|---|
| **Checkout** | Clones the repo from GitHub |
| **Build Docker Image** | Runs `docker build` and tags with `v${BUILD_NUMBER}` |
| **Push to Docker Hub** | Logs into Docker Hub and pushes both `vN` and `latest` tags |
| **Update K8s Manifest** | Uses `sed` to update image tag in `k8s/deployment.yaml`, commits and pushes to GitHub |
| **Cleanup** | Removes local Docker images to free disk space |

### Jenkins Setup Requirements

- Jenkins installed on Ubuntu Linux
- Plugins: Git Plugin, Docker Pipeline, Credentials Binding
- Credentials configured:
  - `dockerhub-creds` — Docker Hub username + access token
  - `github-creds` — GitHub username + PAT
- Jenkins user added to `docker` group

---

## ⚡ CI Pipeline — GitHub Actions

### Workflow Triggers

```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

### Workflow Steps

| Step | Action Used | What it does |
|---|---|---|
| Checkout | `actions/checkout@v4` | Clone repo |
| Login to ghcr.io | `docker/login-action@v3` | Auth with `GITHUB_TOKEN` (automatic) |
| Extract metadata | `docker/metadata-action@v5` | Generate image tags |
| Setup Buildx | `docker/setup-buildx-action@v3` | Enable multi-platform builds + caching |
| Build & Push | `docker/build-push-action@v5` | Build and push to ghcr.io |
| Update Manifest | `run: sed + git push` | Update deployment.yaml with new tag |

### Key advantage over Jenkins
> No server setup needed. `GITHUB_TOKEN` is auto-provided — no manual secrets required for ghcr.io authentication.

---

## 🔄 CD Pipeline — ArgoCD + GKE

### What is GitOps?

> GitOps is a practice where **Git is the single source of truth** for deployments. Instead of manually running `kubectl` commands, changes are committed to Git and ArgoCD automatically syncs the cluster to match.

### ArgoCD Application Config

| Field | Value |
|---|---|
| Repository | `https://github.com/nareshkatta97/sample-ci-cd-app.git` |
| Path | `k8s/` |
| Cluster | `https://kubernetes.default.svc` |
| Namespace | `default` |
| Sync Policy | Automatic |
| Prune | Enabled |
| Self Heal | Enabled |

### Deployment Config

- **Replicas:** 2 pods (high availability)
- **Service type:** LoadBalancer (external IP from GKE)
- **Port:** 3000 (app) → 80 (external)
- **Rolling update:** zero downtime deployments

### ArgoCD Sync Flow

```
Jenkins/GH Actions pushes updated deployment.yaml to GitHub
    │
    │  ArgoCD polls GitHub every 3 minutes
    ▼
ArgoCD detects image tag changed (e.g. latest → v5)
    │
    ▼
ArgoCD syncs → applies updated manifest to GKE
    │
    ▼
GKE pulls new image from registry
    │
    ▼
Rolling update: new pods start, old pods terminate gracefully ✅
```

---

## 🏗️ Infrastructure as Code — Terraform

The GKE cluster is provisioned using Terraform (see `/terraform-gke` folder).

```bash
# Initialize
terraform init

# Preview changes
terraform plan

# Create cluster
terraform apply

# Destroy when done
terraform destroy
```

### Resources provisioned

- `google_container_cluster` — GKE cluster
- `google_container_node_pool` — 2x `e2-small` nodes with auto-repair and auto-upgrade

---

## 🚀 Getting Started

### Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated
- `kubectl` installed
- `terraform` installed (v1.0+)
- Docker installed
- Jenkins server (Ubuntu recommended)

### 1. Clone the repo

```bash
git clone https://github.com/nareshkatta97/sample-ci-cd-app.git
cd sample-ci-cd-app
```

### 2. Provision GKE cluster with Terraform

```bash
cd terraform-gke
terraform init
terraform apply
```

### 3. Connect kubectl to GKE

```bash
gcloud container clusters get-credentials sample-cluster-tf \
  --zone us-central1-a
```

### 4. Install ArgoCD on GKE

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose UI
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "LoadBalancer"}}'

# Get admin password
kubectl get secret argocd-initial-admin-secret \
  -n argocd -o jsonpath="{.data.password}" | base64 -d
```

### 5. Configure Jenkins

- Add `dockerhub-creds` and `github-creds` in Jenkins Credentials Manager
- Create a Pipeline job pointing to this repo
- Enable **GitHub hook trigger for GITScm polling**

### 6. Create ArgoCD Application

```bash
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sample-ci-cd-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/nareshkatta97/sample-ci-cd-app.git
    targetRevision: main
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF
```

---

## 🐳 How to Run Locally

```bash
# Build Docker image
docker build -t sample-ci-cd-app:local .

# Run the container
docker run -p 3000:3000 sample-ci-cd-app:local

# Access the app
open http://localhost:3000
```

---

## 🔁 Full Pipeline Trigger

```bash
# Just push code — everything else is automatic!
git add .
git commit -m "feat: your change"
git push origin main

# Within seconds:
# ✅ Jenkins or GitHub Actions triggers
# ✅ Docker image built and pushed
# ✅ k8s/deployment.yaml updated
# ✅ ArgoCD syncs to GKE
# ✅ New pods live with zero downtime
```

---

## 👤 Author

**Naresh Katta**
- GitHub: [@nareshkatta97](https://github.com/nareshkatta97)
- Role: DevOps Engineer
- Location: Hyderabad, India
