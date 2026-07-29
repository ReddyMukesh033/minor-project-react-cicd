pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        DOCKERHUB_USERNAME    = "${DOCKERHUB_CREDENTIALS_USR}"
        IMAGE_NAME            = "${DOCKERHUB_USERNAME}/react-app"
        IMAGE_TAG             = "${BUILD_NUMBER}"
        SONARQUBE_ENV         = 'MySonarQube'
        AWS_REGION            = 'ap-southeast-2'
        EKS_CLUSTER_NAME      = 'minor-project-cluster'
    }

    stages {

        stage('Checkout Source Code') {
            steps {
                checkout scm
            }
        }

        stage('Clean Workspace') {
            steps {
                sh 'rm -rf node_modules build'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Unit Testing') {
            steps {
                sh 'npm test -- --coverage'
            }
        }

        stage('Build React Application') {
            steps {
                sh 'npm run build'
            }
        }

        stage('SonarQube Code Scan') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh "trivy image --severity HIGH,CRITICAL --exit-code 0 --format table ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Docker Push') {
            steps {
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_USERNAME} --password-stdin"
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }

        stage('Configure AWS CLI') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {
                    sh "aws sts get-caller-identity --region ${AWS_REGION}"
                }
            }
        }

        stage('Connect to Amazon EKS') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {
                    sh "aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}"
                }
            }
        }

        stage('Deploy using Kubernetes Manifests') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {
                    sh "sed -i 's|DOCKERHUB_USERNAME/react-app:latest|${IMAGE_NAME}:${IMAGE_TAG}|g' k8s/deployment.yaml"
                    sh "kubectl apply -f k8s/deployment.yaml"
                    sh "kubectl apply -f k8s/service.yaml"
                }
            }
        }

        stage('Verify Rollout') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {
                    sh "kubectl rollout status deployment/react-app-deployment --timeout=180s"
                }
            }
        }

        stage('Health Check') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-creds'
                ]]) {
                    sh "kubectl get pods -l app=react-app"
                    sh "kubectl get svc react-app-service"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! Application deployed to EKS.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs above for details.'
        }
        always {
            sh 'docker logout || true'
        }
    }
}
