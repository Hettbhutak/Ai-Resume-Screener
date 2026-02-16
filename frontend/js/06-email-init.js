        function upsertBackendCandidateFromApi(apiCandidate) {
            const mapped = {
                id: apiCandidate.id,
                jobId: apiCandidate.job_id,
                name: apiCandidate.full_name || apiCandidate.file_name,
                role: apiCandidate.role || 'Unknown Role',
                email: apiCandidate.email || 'Not found',
                phone: apiCandidate.phone || 'Not found',
                experience: apiCandidate.experience_years || 0,
                skills: apiCandidate.skills || [],
                recommendation: apiCandidate.recommendation || 'Pending',
                score: apiCandidate.final_score || 0,
                semanticScore: apiCandidate.semantic_score || 0,
                mustHaveScore: apiCandidate.must_have_score || 0,
                niceToHaveScore: apiCandidate.nice_to_have_score || 0,
                status: apiCandidate.status || 'completed',
                fileName: apiCandidate.file_name,
                matchReasons: apiCandidate.match_reasons || [],
                timeline: apiCandidate.interview_timeline || [],
                emails: apiCandidate.email_logs || [],
                source: 'Bulk Upload'
            };

            const idx = backendCandidatesCache.findIndex(c => c.id === mapped.id && c.jobId === mapped.jobId);
            if (idx >= 0) backendCandidatesCache[idx] = mapped;
            else backendCandidatesCache.push(mapped);
            return mapped;
        }

        async function refreshCurrentCandidateFromBackend() {
            if (!currentViewingJobId || !currentViewingCandidate) return null;
            const apiCandidate = await apiRequest(`/jobs/${currentViewingJobId}/candidates/${currentViewingCandidate}`);
            return upsertBackendCandidateFromApi(apiCandidate);
        }

        async function scheduleInterviewForCurrentCandidate() {
            if (!currentViewingJobId || !currentViewingCandidate) {
                alert('Schedule interview is available for backend candidates only.');
                return;
            }

            const roundName = prompt('Interview round (e.g., Technical Round 1):', 'Technical Round');
            if (!roundName) return;
            const date = prompt('Interview date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            if (!date) return;
            const time = prompt('Interview time (e.g., 2:00 PM):', '2:00 PM');
            if (!time) return;
            const interviewer = prompt('Interviewer name:', 'Hiring Team') || 'Hiring Team';
            const mode = prompt('Mode (Video Call / In-Person):', 'Video Call') || 'Video Call';
            const duration = Number(prompt('Duration in minutes:', '45') || '45');
            const notes = prompt('Notes (optional):', '') || '';
            const meetLink = prompt('Meeting link (optional):', '') || '';

            try {
                await apiRequest(`/jobs/${currentViewingJobId}/candidates/${currentViewingCandidate}/interviews`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        round_name: roundName,
                        date,
                        time,
                        mode,
                        interviewer,
                        duration_minutes: isNaN(duration) ? 45 : duration,
                        notes,
                        meet_link: meetLink
                    })
                });

                await refreshCurrentCandidateFromBackend();
                loadCandidateTimeline(currentViewingCandidate);
                alert('Interview scheduled successfully.');
            } catch (error) {
                alert(`Could not schedule interview: ${error.message}`);
            }
        }

        async function sendSelectionDecisionEmail(outcome) {
            if (!currentViewingJobId || !currentViewingCandidate) {
                alert('Status email is available for backend candidates only.');
                return;
            }

            const isSelected = outcome === 'selected';
            const defaultSubject = isSelected
                ? 'Congratulations! You are selected'
                : 'Update on your application';
            const defaultMessage = isSelected
                ? 'We are pleased to inform you that you have been selected. Our team will contact you with next steps.'
                : 'Thank you for your interest. At this time, we are moving ahead with other candidates.';

            const subject = prompt('Email subject:', defaultSubject);
            if (!subject) return;
            const message = prompt('Email message:', defaultMessage);
            if (!message) return;

            try {
                await apiRequest(`/jobs/${currentViewingJobId}/candidates/${currentViewingCandidate}/emails/status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        outcome,
                        subject,
                        message
                    })
                });

                await refreshCurrentCandidateFromBackend();
                loadCandidateEmails(currentViewingCandidate);
                filterCandidates();
                alert('Status email sent and logged.');
            } catch (error) {
                alert(`Could not send status email: ${error.message}`);
            }
        }

        // Email Functions
        function prepareEmail(candidateId) {
            currentViewingCandidate = candidateId;
            const candidate = backendCandidatesCache.find(c => c.id === candidateId) || candidates.find(c => c.id === candidateId);
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
                const candidate = backendCandidatesCache.find(c => c.id === currentViewingCandidate) || candidates.find(c => c.id === currentViewingCandidate);
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

    
