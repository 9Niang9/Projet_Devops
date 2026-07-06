pipeline {
    agent any

    environment {
        DOCKER_COMPOSE = "docker-compose"
        PROJECT_NAME   = "bibliotheque-numerique"
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                echo '== Récupération du code depuis GitHub =='
                checkout scm
            }
        }

        stage('Installation des dépendances') {
            parallel {
                stage('Books-service') {
                    steps {
                        dir('backend/livres-service') { sh 'npm install' }
                    }
                }
                stage('Users-service') {
                    steps {
                        dir('backend/utilisateurs-service') { sh 'npm install' }
                    }
                }
                stage('Loans-service') {
                    steps {
                        dir('backend/emprunts-service') { sh 'npm install' }
                    }
                }
            }
        }

        stage('Lint / Vérification de syntaxe') {
            parallel {
                stage('Books-service') {
                    steps {
                        dir('backend/books-service') { sh 'node --check server.js' }
                    }
                }
                stage('Users-service') {
                    steps {
                        dir('backend/users-service') { sh 'node --check server.js' }
                    }
                }
                stage('Loans-service') {
                    steps {
                        dir('backend/loans-service') { sh 'node --check server.js' }
                    }
                }
            }
        }

        stage('Build des images Docker') {
            steps {
                echo '== Construction des images Docker de tous les microservices =='
                sh "${DOCKER_COMPOSE} -p ${PROJECT_NAME} build"
            }
        }

        stage('Tests') {
            steps {
                echo '== (Optionnel) Exécution des tests automatisés =='
                sh 'echo "Aucun test automatisé configuré pour le moment"'
            }
        }

        stage('Déploiement avec Docker Compose') {
            steps {
                echo '== Déploiement de la stack complète =='
                sh "${DOCKER_COMPOSE} -p ${PROJECT_NAME} down"
                sh "${DOCKER_COMPOSE} -p ${PROJECT_NAME} up -d"
            }
        }

        stage('Vérification post-déploiement') {
            steps {
                echo '== Vérification de la disponibilité des services =='
                sh '''
                    sleep 15
                    curl -f http://localhost:3001/health || exit 1
                    curl -f http://localhost:3002/health || exit 1
                    curl -f http://localhost:3003/health || exit 1
                    curl -f http://localhost:8080/ || exit 1
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline exécuté avec succès — application déployée.'
        }
        failure {
            echo '❌ Échec du pipeline — consultez les logs ci-dessus.'
        }
        always {
            sh "${DOCKER_COMPOSE} -p ${PROJECT_NAME} ps"
        }
    }
}
