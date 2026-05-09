pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        GITHUB_CREDENTIALS    = credentials('github-creds')
        IMAGE_NAME            = 'kattanaresh/sample-ci-cd-app'
        IMAGE_TAG             = "v${BUILD_NUMBER}"
        GITHUB_REPO           = 'nareshkatta97/sample-ci-cd-app'
    }

    stages {

        // ── Stage 1: Clone repo ──────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Cloning from GitHub...'
                git branch: 'main',
                    url: "https://github.com/${GITHUB_REPO}.git"
            }
        }

        // ── Stage 2: Build Docker image ──────────────────────────────────
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building ${IMAGE_NAME}:${IMAGE_TAG}"
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                    docker tag  ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                """
            }
        }

        // ── Stage 3: Push to Docker Hub ──────────────────────────────────
        stage('Push to Docker Hub') {
            steps {
                echo '🚀 Pushing to Docker Hub...'
                sh """
                    echo ${DOCKERHUB_CREDENTIALS_PSW} | \
                    docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                    docker push ${IMAGE_NAME}:${IMAGE_TAG}
                    docker push ${IMAGE_NAME}:latest
                """
            }
        }

        // ── Stage 4: Update K8s manifest (ArgoCD watches this) ───────────
        stage('Update K8s Manifest') {
            steps {
                echo "📝 Updating k8s/deployment.yaml with tag ${IMAGE_TAG}..."
                sh """
                    # Update the image tag in deployment.yaml
                    sed -i 's|image: kattanaresh/sample-ci-cd-app:.*|image: kattanaresh/sample-ci-cd-app:${IMAGE_TAG}|g' k8s/deployment.yaml

                    # Configure git
                    git config user.email "jenkins@ci.local"
                    git config user.name  "Jenkins CI"

                    # Commit and push the updated manifest
                    git add k8s/deployment.yaml
                    git commit -m "CI: update image to ${IMAGE_NAME}:${IMAGE_TAG} [skip ci]"
                    git push https://${GITHUB_CREDENTIALS_USR}:${GITHUB_CREDENTIALS_PSW}@github.com/${GITHUB_REPO}.git main
                """
            }
        }

        // ── Stage 5: Cleanup ─────────────────────────────────────────────
        stage('Cleanup') {
            steps {
                sh """
                    docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${IMAGE_NAME}:latest       || true
                    docker logout || true
                """
            }
        }
    }

    post {
        success {
            echo "✅ Done! ArgoCD will now sync ${IMAGE_TAG} to GKE automatically."
        }
        failure {
            echo '❌ Pipeline failed — check logs above.'
        }
    }
}
