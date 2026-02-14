        // AI Search Functions
        function performAISearch() {
            const searchQuery = document.getElementById('aiSearchInput').value;
            if (!searchQuery.trim()) {
                alert('Please enter a search query');
                return;
            }

            const selectedPool = backendCandidatesCache.length > 0 ? backendCandidatesCache : candidates;
            const results = selectedPool.map(candidate => {
                const query = searchQuery.toLowerCase();
                let score = 0;
                
                if (candidate.name.toLowerCase().includes(query)) score += 20;
                if (candidate.role.toLowerCase().includes(query)) score += 30;
                candidate.skills.forEach(skill => {
                    if (query.includes(skill.toLowerCase())) score += 15;
                });
                if (query.includes(String(candidate.experience || 0))) score += 10;
                
                return { ...candidate, matchScore: Math.min(score, 95) };
            }).filter(c => c.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

            displayAISearchResults(results, searchQuery);
        }

        function displayAISearchResults(results, query) {
            const container = document.getElementById('candidatesList');
            
            if (results.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                        <h3>No matches found</h3>
                        <p style="color: var(--text-muted); margin-top: 0.5rem;">Try adjusting your search query: "${query}"</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="card mb-2" style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white;">
                    <strong>🎯 AI Search Results:</strong> Found ${results.length} candidates matching "${query}"
                </div>
            ` + results.map(candidate => `
                <div class="candidate-card" onclick="viewCandidate(${candidate.id})">
                    <div class="candidate-header">
                        <div>
                            <div class="candidate-name">${candidate.name}</div>
                            <div class="candidate-role">${candidate.role}</div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <div class="match-score ${candidate.matchScore >= 70 ? 'high' : candidate.matchScore >= 50 ? 'medium' : 'low'}">
                                ${candidate.matchScore}% Match
                            </div>
                            <span class="badge badge-${candidate.status.toLowerCase().replace(' ', '-')}">${candidate.status}</span>
                        </div>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">📧 ${candidate.email}</span>
                        <span class="candidate-meta-item">📞 ${candidate.phone}</span>
                        <span class="candidate-meta-item">💼 ${candidate.experience} years</span>
                    </div>
                    <div class="candidate-meta mt-1">
                        <span class="candidate-meta-item"><strong>Skills:</strong> ${candidate.skills.join(', ')}</span>
                    </div>
                    ${candidate.rating ? `
                        <div class="mt-1">
                            <div class="rating">
                                ${[1,2,3,4,5].map(i => `<span class="star ${i <= candidate.rating ? 'filled' : ''}">★</span>`).join('')}
                                <span style="margin-left: 0.5rem; color: var(--text-muted);">${candidate.rating}/5</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        function handleJDUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            document.getElementById('jdUploadZone').style.display = 'none';
            document.getElementById('jdUploadedInfo').style.display = 'flex';
            document.getElementById('jdFileName').textContent = file.name;

            setTimeout(() => {
                alert(`JD "${file.name}" analyzed! Now showing candidates matched to this job description.`);
                performAISearch();
            }, 1000);
        }

        function clearJD() {
            document.getElementById('jdUploadZone').style.display = 'block';
            document.getElementById('jdUploadedInfo').style.display = 'none';
            document.getElementById('jdFileInput').value = '';
            loadCandidates();
        }

        // Candidate Tab Switching
        function switchCandidateTab(tabName) {
            document.querySelectorAll('#viewCandidateModal .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#viewCandidateModal .tab-content').forEach(tc => tc.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(`candidate-${tabName}-tab`).classList.add('active');

            if (tabName === 'timeline' && currentViewingCandidate) {
                loadCandidateTimeline(currentViewingCandidate);
            } else if (tabName === 'emails' && currentViewingCandidate) {
                loadCandidateEmails(currentViewingCandidate);
            }
        }

        function loadCandidateTimeline(candidateId) {
            const candidate = candidates.find(c => c.id === candidateId);
            if (!candidate || !candidate.timeline) return;

            const container = document.getElementById('candidateTimelineContent');
            container.innerHTML = candidate.timeline.map(item => `
                <div class="timeline-item ${item.status}">
                    <div class="timeline-content">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <strong>${item.stage}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">${new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        ${item.interviewer ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">👤 Interviewer: ${item.interviewer}</div>` : ''}
                        ${item.rating ? `
                            <div class="rating" style="margin-bottom: 0.5rem;">
                                ${[1,2,3,4,5].map(i => `<span class="star ${i <= item.rating ? 'filled' : ''}">★</span>`).join('')}
                                <span style="margin-left: 0.5rem;">${item.rating}/5</span>
                            </div>
                        ` : ''}
                        ${item.notes ? `<div style="font-size: 0.9rem; margin-top: 0.5rem;">${item.notes}</div>` : ''}
                        ${item.meetLink ? `
                            <div style="margin-top: 0.75rem;">
                                <button class="meet-button btn-sm" onclick="window.open('${item.meetLink}', '_blank')">View Meet Link</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        function loadCandidateEmails(candidateId) {
            const candidate = candidates.find(c => c.id === candidateId);
            if (!candidate || !candidate.emails) return;

            const container = document.getElementById('candidateEmailsContent');
            
            if (candidate.emails.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                        <p>No emails sent yet</p>
                        <button class="btn btn-primary mt-2" onclick="prepareEmail(${candidateId})">Send First Email</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = candidate.emails.map(email => `
                <div class="email-log">
                    <div class="email-log-header">
                        <div>
                            <div class="email-type">${email.type}</div>
                            ${email.subject ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">${email.subject}</div>` : ''}
                        </div>
                        <span class="email-status ${email.status}">${email.status.toUpperCase()}</span>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">📤 Sent: ${new Date(email.sentDate).toLocaleDateString()}</span>
                        ${email.openedDate ? `<span class="candidate-meta-item">👁️ Opened: ${new Date(email.openedDate).toLocaleDateString()}</span>` : ''}
                        ${email.repliedDate ? `<span class="candidate-meta-item">↩️ Replied: ${new Date(email.repliedDate).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }

