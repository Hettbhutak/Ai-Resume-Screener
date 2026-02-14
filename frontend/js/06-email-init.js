        // Email Functions
        function prepareEmail(candidateId) {
            currentViewingCandidate = candidateId;
            const candidate = candidates.find(c => c.id === candidateId);
            if (candidate) {
                document.getElementById('emailTo').value = candidate.email;
            }
            showModal('sendEmailModal');
        }

        function sendCandidateEmail(event) {
            event.preventDefault();
            
            const emailData = {
                type: document.getElementById('emailType').value,
                to: document.getElementById('emailTo').value,
                subject: document.getElementById('emailSubject').value,
                body: document.getElementById('emailBody').value,
                meetLink: document.getElementById('meetLink')?.value
            };

            if (currentViewingCandidate) {
                const candidate = candidates.find(c => c.id === currentViewingCandidate);
                if (candidate) {
                    if (!candidate.emails) candidate.emails = [];
                    candidate.emails.push({
                        type: emailData.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        subject: emailData.subject,
                        sentDate: new Date().toISOString().split('T')[0],
                        status: 'sent'
                    });
                }
            }

            alert('✅ Email sent successfully! The system will track opens and responses.');
            closeModal('sendEmailModal');
            event.target.reset();
            
            if (document.getElementById('candidate-emails-tab').classList.contains('active')) {
                loadCandidateEmails(currentViewingCandidate);
            }
        }

        function loadEmailTemplate() {
            const type = document.getElementById('emailType').value;
            const template = emailTemplates[type];
            
            if (template) {
                document.getElementById('emailSubject').value = template.subject;
                document.getElementById('emailBody').value = template.body;
            }

            if (type === 'interview-invite' || type === 'final-round') {
                document.getElementById('meetLinkGroup').style.display = 'block';
            } else {
                document.getElementById('meetLinkGroup').style.display = 'none';
            }
        }

        function generateMeetLink() {
            const randomId = Math.random().toString(36).substring(2, 15);
            const meetLink = `https://meet.google.com/${randomId.slice(0,3)}-${randomId.slice(3,7)}-${randomId.slice(7,10)}`;
            document.getElementById('meetLink').value = meetLink;
            alert('📹 Google Meet link generated! In production, this integrates with Google Calendar API.');
        }

        // Drag and Drop
        document.addEventListener('DOMContentLoaded', () => {
            const uploadZone = document.getElementById('uploadZone');
            if (uploadZone) {
                uploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadZone.classList.add('dragover');
                });

                uploadZone.addEventListener('dragleave', () => {
                    uploadZone.classList.remove('dragover');
                });

                uploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('dragover');
                    const files = e.dataTransfer.files;
                    document.getElementById('bulkResumeInput').files = files;
                    handleBulkUpload({ target: { files } });
                });
            }

            refreshJobsFromBackend().then(() => {
                loadCandidates();
            });
        });

    
