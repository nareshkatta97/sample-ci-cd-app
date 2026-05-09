pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')       // Jenkins credential ID
        DOCKERHUB_USERNAME    = 'nareshkatta97'                       // ← your Docker Hub username
        IMAGE_NAME            = 'nareshkatta97/sample-ci-cd-app'     // ← image name on Docker Hub
        IMAGE_TAG             = "v${BUILD_NUMBER}"                    // auto: v1, v2, v3...
    }

    stages {

        // ── Stage 1: Clone from GitHub ───────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Cloning from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/nareshkatta97/sample-ci-cd-app.git'
                    // No credentialsId needed — repo is PUBLIC ✅
            }
        }

        // ── Stage 2: Build Docker Image ──────────────────────────────────
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
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

        // ── Stage 4: Cleanup ─────────────────────────────────────────────
        stage('Cleanup') {
            steps {
                echo '🧹 Cleaning up local images...'
                sh """
                    docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true
                    docker rmi ${IMAGE_NAME}:latest       || true
                    docker logout || true
                """
            }
        }
    }

    // ── Post Actions (echo only — no sh outside node) ────────────────────
    post {
        success {
            echo "✅ SUCCESS! Image pushed → hub.docker.com/r/nareshkatta97/sample-ci-cd-app:${IMAGE_TAG}"
        }
        failure {
            echo '❌ FAILED — Check the stage logs above.'
        }
    }
}
