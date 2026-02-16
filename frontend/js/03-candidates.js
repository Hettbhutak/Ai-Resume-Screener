        // Load Candidates
        async function loadCandidates(filter = {}) {
            const container = document.getElementById('candidatesList');
            const selectedJobId = document.getElementById('jobFilter')?.value || '';

            if (selectedJobId) {
                try {
                    const dbCandidates = await apiRequest(`/jobs/${selectedJobId}/candidates?sort=score_desc`);
                    backendCandidatesCache = dbCandidates.map(c => ({
                        id: c.id,
                        jobId: c.job_id,
                        name: c.full_name || c.file_name,
                        role: c.role || 'Unknown Role',
                        email: c.email || 'Not found',
                        phone: c.phone || 'Not found',
                        experience: c.experience_years || 0,
                        skills: c.skills || [],
                        recommendation: c.recommendation || 'Pending',
                        score: c.final_score || 0,
                        semanticScore: c.semantic_score || 0,
                        mustHaveScore: c.must_have_score || 0,
                        niceToHaveScore: c.nice_to_have_score || 0,
                        status: c.status || 'completed',
                        fileName: c.file_name,
                        matchReasons: c.match_reasons || [],
                        timeline: c.interview_timeline || [],
                        emails: c.email_logs || [],
                        source: 'Bulk Upload'
                    }));

                    let filteredCandidates = [...backendCandidatesCache];
                    const statusFilter = filter.status || '';
                    if (statusFilter === 'Selected') {
                        filteredCandidates = filteredCandidates.filter(c => c.recommendation === 'Shortlist');
                    } else if (statusFilter === 'Consider') {
                        filteredCandidates = filteredCandidates.filter(c => c.recommendation === 'Consider');
                    } else if (statusFilter === 'Rejected') {
                        filteredCandidates = filteredCandidates.filter(c => c.recommendation === 'Reject');
                    } else if (statusFilter === 'Screening') {
                        filteredCandidates = filteredCandidates.filter(c => c.status === 'queued' || c.status === 'processing');
                    }
                    if (filter.role) {
                        filteredCandidates = filteredCandidates.filter(c => c.role.toLowerCase().includes(filter.role.toLowerCase()));
                    }
                    if (filter.search) {
                        const searchTerm = filter.search.toLowerCase();
                        filteredCandidates = filteredCandidates.filter(c =>
                            c.name.toLowerCase().includes(searchTerm) ||
                            c.role.toLowerCase().includes(searchTerm) ||
                            c.email.toLowerCase().includes(searchTerm) ||
                            c.skills.some(s => s.toLowerCase().includes(searchTerm))
                        );
                    }

                    container.innerHTML = filteredCandidates.map(candidate => `
                        <div class="candidate-card" onclick="viewCandidate(${candidate.id})">
                            <div class="candidate-header">
                                <div>
                                    <div class="candidate-name">${candidate.name}</div>
                                    <div class="candidate-role">${candidate.role} • ${candidate.experience} years</div>
                                </div>
                                <div style="display:flex; gap:0.5rem; align-items:center;">
                                    <div class="match-score ${candidate.score >= 85 ? 'high' : candidate.score >= 70 ? 'medium' : 'low'}">
                                        ${Number(candidate.score).toFixed(1)}%
                                    </div>
                                    <span class="badge ${mapRecommendationBadge(candidate.recommendation)}">${candidate.recommendation}</span>
                                </div>
                            </div>
                            <div class="candidate-meta">
                                <span class="candidate-meta-item">📧 ${candidate.email}</span>
                                <span class="candidate-meta-item">📞 ${candidate.phone}</span>
                                <span class="candidate-meta-item">📄 ${candidate.fileName}</span>
                                <span class="badge badge-screening">Job #${candidate.jobId}</span>
                            </div>
                            <div class="candidate-meta mt-1">
                                <span class="candidate-meta-item"><strong>Skills:</strong> ${(candidate.skills || []).join(', ') || 'Not detected'}</span>
                            </div>
                            <div class="candidate-meta mt-1">
                                <span class="candidate-meta-item"><strong>Scores:</strong> Semantic ${Number(candidate.semanticScore).toFixed(1)}% | Must-have ${Number(candidate.mustHaveScore).toFixed(1)}% | Nice-to-have ${Number(candidate.niceToHaveScore).toFixed(1)}%</span>
                            </div>
                            ${(candidate.matchReasons || []).length ? `
                                <div class="candidate-meta mt-1">
                                    <span class="candidate-meta-item"><strong>Why matched:</strong> ${(candidate.matchReasons || []).join(' | ')}</span>
                                </div>
                            ` : ''}
                            <div class="action-buttons mt-2">
                                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); shortlistFromCandidates(${candidate.jobId}, ${candidate.id})">Shortlist</button>
                                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); rejectFromCandidates(${candidate.jobId}, ${candidate.id})">Reject</button>
                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.open('${API_BASE_URL}/jobs/${candidate.jobId}/candidates/${candidate.id}/resume', '_blank')">View Resume</button>
                            </div>
                        </div>
                    `).join('');
                    return;
                } catch (error) {
                    container.innerHTML = `
                        <div class="card" style="text-align:center; padding:2rem;">
                            <div style="font-size:1.2rem; margin-bottom:0.5rem;">Could not load backend candidates</div>
                            <div style="color: var(--text-muted);">${error.message}</div>
                        </div>
                    `;
                    return;
                }
            }

            let filteredCandidates = candidates;
            if (filter.status) filteredCandidates = filteredCandidates.filter(c => c.status === filter.status);
            if (filter.source) filteredCandidates = filteredCandidates.filter(c => c.source === filter.source);
            if (filter.role) filteredCandidates = filteredCandidates.filter(c => c.role.includes(filter.role));
            if (filter.search) {
                const searchTerm = filter.search.toLowerCase();
                filteredCandidates = filteredCandidates.filter(c =>
                    c.name.toLowerCase().includes(searchTerm) ||
                    c.role.toLowerCase().includes(searchTerm) ||
                    c.skills.some(s => s.toLowerCase().includes(searchTerm))
                );
            }

            container.innerHTML = filteredCandidates.map(candidate => `
                <div class="candidate-card" onclick="viewCandidate(${candidate.id})">
                    <div class="candidate-header">
                        <div>
                            <div class="candidate-name">${candidate.name}</div>
                            <div class="candidate-role">${candidate.role}</div>
                        </div>
                        <div>
                            <span class="badge badge-${candidate.status.toLowerCase().replace(' ', '-')}">${candidate.status}</span>
                        </div>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">📧 ${candidate.email}</span>
                        <span class="candidate-meta-item">📞 ${candidate.phone}</span>
                        <span class="candidate-meta-item">💼 ${candidate.experience} years</span>
                        <span class="badge badge-${candidate.source.toLowerCase().replace(' ', '-')}">${candidate.source}</span>
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
                    <div class="action-buttons mt-2">
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); showModal('feedbackModal')">Add Feedback</button>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); updateStatus(${candidate.id})">Update Status</button>
                    </div>
                </div>
            `).join('');
        }

        // Load Talent Pool
        async function loadTalentPool() {
            const container = document.getElementById('talentPoolList');

            try {
                if (backendJobs.length === 0) {
                    await refreshJobsFromBackend();
                }

                if (backendJobs.length > 0) {
                    const allJobCandidateLists = await Promise.all(
                        backendJobs.map(job =>
                            apiRequest(`/jobs/${job.id}/candidates?sort=score_desc&recommendation=Shortlist`)
                        )
                    );
                    const selectedCandidates = allJobCandidateLists.flat().map(c => ({
                        id: c.id,
                        jobId: c.job_id,
                        name: c.full_name || c.file_name,
                        role: c.role || 'Unknown Role',
                        email: c.email || 'Not found',
                        phone: c.phone || 'Not found',
                        experience: c.experience_years || 0,
                        skills: c.skills || [],
                        score: c.final_score || 0
                    }));

                    container.innerHTML = selectedCandidates.length === 0 ? `
                        <div class="card" style="text-align: center; padding: 2rem;">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                            <div>No shortlisted candidates found in backend yet.</div>
                        </div>
                    ` : selectedCandidates.map(candidate => `
                        <div class="candidate-card">
                            <div class="candidate-header">
                                <div>
                                    <div class="candidate-name">${candidate.name}</div>
                                    <div class="candidate-role">${candidate.role}</div>
                                </div>
                                <div>
                                    <span class="badge badge-ready">Ready to Deploy</span>
                                </div>
                            </div>
                            <div class="candidate-meta">
                                <span class="candidate-meta-item">📧 ${candidate.email}</span>
                                <span class="candidate-meta-item">📞 ${candidate.phone}</span>
                                <span class="candidate-meta-item">💼 ${candidate.experience} years</span>
                                <span class="candidate-meta-item">🎯 ${Number(candidate.score).toFixed(1)}%</span>
                            </div>
                            <div class="candidate-meta mt-1">
                                <span class="candidate-meta-item"><strong>Skills:</strong> ${(candidate.skills || []).join(', ') || 'Not detected'}</span>
                            </div>
                            <div class="action-buttons mt-2">
                                <button class="btn btn-sm btn-primary" onclick="window.open('${API_BASE_URL}/jobs/${candidate.jobId}/candidates/${candidate.id}/resume', '_blank')">Open Resume</button>
                            </div>
                        </div>
                    `).join('');
                    return;
                }
            } catch (error) {
                console.error('Could not load backend talent pool:', error);
            }

            const selectedCandidates = candidates.filter(c => c.status === 'Selected');
            container.innerHTML = selectedCandidates.map(candidate => `
                <div class="candidate-card">
                    <div class="candidate-header">
                        <div>
                            <div class="candidate-name">${candidate.name}</div>
                            <div class="candidate-role">${candidate.role}</div>
                        </div>
                        <div>
                            <span class="badge badge-ready">Ready to Deploy</span>
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
                    <div class="mt-1">
                        <div class="rating">
                            ${[1,2,3,4,5].map(i => `<span class="star ${i <= candidate.rating ? 'filled' : ''}">★</span>`).join('')}
                            <span style="margin-left: 0.5rem; color: var(--text-muted);">${candidate.rating}/5</span>
                        </div>
                    </div>
                    <div class="action-buttons mt-2">
                        <button class="btn btn-sm btn-primary" onclick="deployCandidate(${candidate.id})">Deploy to Project</button>
                        <button class="btn btn-sm btn-secondary" onclick="viewCandidate(${candidate.id})">View Details</button>
                    </div>
                </div>
            `).join('');
        }

        function syncStatusChips(activeStatus) {
            const chipsContainer = document.getElementById('candidateStatusChips');
            if (!chipsContainer) return;

            chipsContainer.querySelectorAll('.status-chip').forEach(btn => {
                btn.classList.remove('active');
            });

            const labels = {
                '': 'All',
                'Selected': 'Shortlisted',
                'Consider': 'Consider',
                'Rejected': 'Rejected',
                'Screening': 'Processing'
            };

            const targetLabel = labels[activeStatus || ''] || 'All';
            const chip = Array.from(chipsContainer.querySelectorAll('.status-chip')).find(
                btn => btn.textContent.trim() === targetLabel
            );
            if (chip) chip.classList.add('active');
        }

        function applyStatusChip(status) {
            const statusSelect = document.getElementById('statusFilter');
            if (statusSelect) statusSelect.value = status;
            filterCandidates();
        }

        // Filter Functions
        function filterCandidates(status) {
            if (status) {
                document.getElementById('statusFilter').value = status;
            }
            
            const filters = {
                status: document.getElementById('statusFilter')?.value || '',
                source: document.getElementById('sourceFilter')?.value || '',
                role: document.getElementById('roleFilter')?.value || '',
                search: document.getElementById('candidateSearch')?.value || ''
            };
            syncStatusChips(filters.status);
            loadCandidates(filters);
        }

        function searchCandidates() {
            filterCandidates();
        }

        // Template Functions
        function loadTemplate() {
            const templateType = document.getElementById('templateType').value;
            const template = emailTemplates[templateType];
            const preview = document.getElementById('templatePreview');
            
            preview.innerHTML = `
                <div class="email-preview-header">Subject: ${template.subject}</div>
                <div style="white-space: pre-wrap; line-height: 1.8;">${template.body}</div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.85rem;">
                    <strong>Template Variables:</strong> {{name}}, {{role}}, {{date}}, {{time}}, etc.
                </div>
            `;
        }

        function editTemplate() {
            alert('Template editor would open here. In production, this would allow you to customize the template.');
        }

        function useTemplate() {
            alert('This would allow you to use the template with a selected candidate, filling in the variables.');
        }

        // View Candidate
        function viewCandidate(id) {
            const backendCandidate = backendCandidatesCache.find(c => c.id === id);
            const candidate = backendCandidate || candidates.find(c => c.id === id);
            if (!candidate) return;
            
            currentViewingCandidate = id;
            currentViewingJobId = backendCandidate ? backendCandidate.jobId : null;
            document.getElementById('viewCandidateName').textContent = candidate.name;
            document.getElementById('emailTo').value = candidate.email;
            
            // Load profile tab
            document.getElementById('candidateDetailsContent').innerHTML = `
                <div class="form-group">
                    <label>Role</label>
                    <input type="text" value="${candidate.role}" readonly>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="text" value="${candidate.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" value="${candidate.phone}" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Source</label>
                        <input type="text" value="${candidate.source || 'Bulk Upload'}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <input type="text" value="${candidate.recommendation || candidate.status}" readonly>
                    </div>
                </div>
                <div class="form-group">
                    <label>Experience</label>
                    <input type="text" value="${candidate.experience} years" readonly>
                </div>
                ${backendCandidate ? `
                    <div class="form-group">
                        <label>Match Score</label>
                        <input type="text" value="${Number(candidate.score || 0).toFixed(1)}%" readonly>
                    </div>
                    <div class="form-group">
                        <label>Score Breakdown</label>
                        <input type="text" value="Semantic ${Number(candidate.semanticScore || 0).toFixed(1)}% | Must-have ${Number(candidate.mustHaveScore || 0).toFixed(1)}% | Nice-to-have ${Number(candidate.niceToHaveScore || 0).toFixed(1)}%" readonly>
                    </div>
                    <div class="form-group">
                        <label>Resume File</label>
                        <input type="text" value="${candidate.fileName || ''}" readonly>
                    </div>
                ` : ''}
                <div class="form-group">
                    <label>Skills</label>
                    <div style="margin-top: 0.5rem;">
                        ${candidate.skills.map(skill => `<span class="badge" style="margin-right: 0.5rem; margin-bottom: 0.5rem;">${skill}</span>`).join('')}
                    </div>
                </div>
                ${backendCandidate && candidate.matchReasons ? `
                    <div class="form-group">
                        <label>Why Matched</label>
                        <textarea readonly>${candidate.matchReasons.join('\n')}</textarea>
                    </div>
                ` : ''}
                ${candidate.rating ? `
                    <div class="form-group">
                        <label>Overall Rating</label>
                        <div class="rating" style="margin-top: 0.5rem;">
                            ${[1,2,3,4,5].map(i => `<span class="star ${i <= candidate.rating ? 'filled' : ''}">★</span>`).join('')}
                            <span style="margin-left: 0.5rem;">${candidate.rating}/5</span>
                        </div>
                    </div>
                ` : ''}
                <div class="form-group">
                    <label>Notes</label>
                    <textarea readonly>${candidate.notes || 'No additional notes.'}</textarea>
                </div>
                <div class="form-group">
                    <label>Applied Date</label>
                    <input type="text" value="${candidate.appliedDate ? new Date(candidate.appliedDate).toLocaleDateString() : 'N/A'}" readonly>
                </div>
                <div class="action-buttons mt-2">
                    <button class="btn btn-secondary" onclick="closeModal('viewCandidateModal')">Close</button>
                    ${backendCandidate ? `
                        <button class="btn btn-success" onclick="shortlistFromCandidates(${candidate.jobId}, ${candidate.id})">Shortlist</button>
                        <button class="btn btn-danger" onclick="rejectFromCandidates(${candidate.jobId}, ${candidate.id})">Reject</button>
                        <button class="btn btn-primary" onclick="window.open('${API_BASE_URL}/jobs/${candidate.jobId}/candidates/${candidate.id}/resume', '_blank')">Open Resume</button>
                    ` : `<button class="btn btn-primary" onclick="editCandidate(${candidate.id})">Edit</button>`}
                </div>
            `;
            
            showModal('viewCandidateModal');
        }

        // Form Submissions
        function addCandidate(event) {
            event.preventDefault();
            alert('Candidate added successfully! In production, this would save to the database.');
            closeModal('addCandidateModal');
            event.target.reset();
        }

        function submitFeedback(event) {
            event.preventDefault();
            alert('Interview feedback submitted successfully!');
            closeModal('feedbackModal');
            event.target.reset();
        }

        function updateStatus(id) {
            alert(`Update status for candidate ID: ${id}. In production, this would show a status update form.`);
        }

        function deployCandidate(id) {
            const candidate = candidates.find(c => c.id === id);
            alert(`Deploy ${candidate.name} to a project. In production, this would show project assignment options.`);
        }

        function editCandidate(id) {
            alert(`Edit candidate ID: ${id}. In production, this would show an edit form.`);
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function normalizeRecommendation(recommendation) {
            const rec = String(recommendation || '').toLowerCase();
            if (rec === 'shortlist') return 'Shortlist';
            if (rec === 'reject') return 'Reject';
            if (rec === 'consider') return 'Consider';
            return 'Pending';
        }

        function formatInterviewDateTime(dateText, timeText) {
            if (!dateText) return 'Date TBD';
            const dateOnly = String(dateText).split('T')[0];
            const today = new Date();
            const todayText = today.toISOString().split('T')[0];
            const dateLabel = dateOnly === todayText
                ? 'Today'
                : new Date(dateOnly).toLocaleDateString();
            return `${dateLabel}${timeText ? `, ${timeText}` : ''}`;
        }

        function isInterviewTimelineItem(item) {
            const stage = String(item?.stage || '').toLowerCase();
            return stage.includes('interview') || !!item?.interviewer || !!item?.time || !!item?.mode || !!item?.meetLink;
        }

        function extractInterviewEntries(candidate) {
            const entries = [];
            const timeline = candidate.timeline || [];
            timeline.forEach(item => {
                if (!isInterviewTimelineItem(item)) return;
                const stage = String(item.stage || 'Interview');
                entries.push({
                    candidateId: candidate.id,
                    jobId: candidate.jobId,
                    name: candidate.name || 'Candidate',
                    role: candidate.role || 'Role not specified',
                    stage,
                    round: stage.replace(/^Interview Scheduled -\s*/i, ''),
                    date: item.date || '',
                    time: item.time || '',
                    interviewer: item.interviewer || 'TBD',
                    duration: item.duration || '',
                    mode: item.mode || 'Not specified',
                    meetLink: item.meetLink || '',
                    timelineStatus: String(item.status || '').toLowerCase(),
                    recommendation: normalizeRecommendation(candidate.recommendation)
                });
            });
            return entries;
        }

        function interviewSortValue(entry) {
            const baseDate = entry.date ? entry.date : '9999-12-31';
            return `${baseDate} ${entry.time || ''}`.trim();
        }

        function buildInterviewCard(entry, section) {
            const statusBadge = section === 'scheduled'
                ? `<span class="badge badge-interview">${escapeHtml(formatInterviewDateTime(entry.date, entry.time))}</span>`
                : section === 'pending'
                    ? '<span class="badge badge-warning">Feedback Pending</span>'
                    : `<span class="badge ${entry.recommendation === 'Shortlist' ? 'badge-selected' : entry.recommendation === 'Reject' ? 'badge-rejected' : 'badge-success'}">${escapeHtml(entry.recommendation)}</span>`;

            const decisionActions = !entry.jobId
                ? ''
                : entry.recommendation === 'Shortlist' || entry.recommendation === 'Reject'
                ? `<button class="btn btn-sm btn-secondary" disabled>${entry.recommendation}</button>`
                : `
                    <button class="btn btn-sm btn-success" onclick="setInterviewDecision(${entry.jobId}, ${entry.candidateId}, 'Shortlist')">Select</button>
                    <button class="btn btn-sm btn-danger" onclick="setInterviewDecision(${entry.jobId}, ${entry.candidateId}, 'Reject')">Reject</button>
                `;

            const joinButton = entry.meetLink
                ? `<a class="btn btn-sm btn-primary" href="${escapeHtml(entry.meetLink)}" target="_blank" rel="noopener noreferrer">Join Meeting</a>`
                : '<button class="btn btn-sm btn-secondary" disabled>No Meeting Link</button>';

            return `
                <div class="candidate-card">
                    <div class="candidate-header">
                        <div>
                            <div class="candidate-name">${escapeHtml(entry.name)} - ${escapeHtml(entry.round)}</div>
                            <div class="candidate-role">${escapeHtml(entry.role)}</div>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">Interviewer: ${escapeHtml(entry.interviewer)}</span>
                        <span class="candidate-meta-item">Duration: ${escapeHtml(entry.duration || 'TBD')}</span>
                        <span class="candidate-meta-item">Mode: ${escapeHtml(entry.mode)}</span>
                        <span class="candidate-meta-item">Date: ${escapeHtml(formatInterviewDateTime(entry.date, entry.time))}</span>
                        ${entry.jobId ? `<span class="badge badge-screening">Job #${escapeHtml(entry.jobId)}</span>` : ''}
                    </div>
                    <div class="action-buttons mt-2">
                        ${section === 'scheduled' ? joinButton : ''}
                        <button class="btn btn-sm btn-secondary" onclick="viewCandidate(${entry.candidateId})">View Candidate</button>
                        ${decisionActions}
                    </div>
                </div>
            `;
        }

        function renderInterviewSection(containerId, entries, section) {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (!entries.length) {
                const emptyMessage = section === 'scheduled'
                    ? 'No scheduled interviews yet.'
                    : section === 'pending'
                        ? 'No interviews pending feedback.'
                        : 'No completed interview decisions yet.';
                container.innerHTML = `
                    <div class="candidate-card" style="text-align: center;">
                        <div class="candidate-role">${emptyMessage}</div>
                    </div>
                `;
                return;
            }
            container.innerHTML = entries.map(item => buildInterviewCard(item, section)).join('');
        }

        async function loadInterviews() {
            renderInterviewSection('scheduledInterviews', [], 'scheduled');
            renderInterviewSection('pendingFeedbackList', [], 'pending');
            renderInterviewSection('completedInterviews', [], 'completed');

            let candidatePool = [];
            try {
                await refreshJobsFromBackend();
                if (backendJobs.length > 0) {
                    const allJobCandidates = await Promise.all(
                        backendJobs.map(job => apiRequest(`/jobs/${job.id}/candidates?sort=latest`))
                    );
                    candidatePool = allJobCandidates.flat().map(c => ({
                        id: c.id,
                        jobId: c.job_id,
                        name: c.full_name || c.file_name,
                        role: c.role || 'Unknown Role',
                        email: c.email || 'Not found',
                        phone: c.phone || 'Not found',
                        experience: c.experience_years || 0,
                        skills: c.skills || [],
                        recommendation: c.recommendation || 'Pending',
                        score: c.final_score || 0,
                        semanticScore: c.semantic_score || 0,
                        mustHaveScore: c.must_have_score || 0,
                        niceToHaveScore: c.nice_to_have_score || 0,
                        status: c.status || 'completed',
                        fileName: c.file_name,
                        matchReasons: c.match_reasons || [],
                        timeline: c.interview_timeline || [],
                        emails: c.email_logs || [],
                        source: 'Bulk Upload'
                    }));
                    backendCandidatesCache = candidatePool;
                }
            } catch (error) {
                console.error('Could not load interviews from backend:', error);
            }

            if (candidatePool.length === 0) {
                candidatePool = (backendCandidatesCache || []).length > 0 ? backendCandidatesCache : candidates;
            }

            const interviewEntries = candidatePool
                .flatMap(candidate => extractInterviewEntries(candidate))
                .sort((a, b) => interviewSortValue(a).localeCompare(interviewSortValue(b)));

            const scheduled = interviewEntries.filter(i => i.timelineStatus !== 'completed');
            const pendingFeedback = interviewEntries.filter(i => i.timelineStatus === 'completed' && i.recommendation === 'Pending');
            const completed = interviewEntries.filter(i => i.timelineStatus === 'completed' && i.recommendation !== 'Pending');

            renderInterviewSection('scheduledInterviews', scheduled, 'scheduled');
            renderInterviewSection('pendingFeedbackList', pendingFeedback, 'pending');
            renderInterviewSection('completedInterviews', completed, 'completed');
        }

        async function setInterviewDecision(jobId, candidateId, decision) {
            try {
                const updated = await updateBackendCandidate(jobId, candidateId, decision);
                if (typeof upsertBackendCandidateFromApi === 'function') {
                    upsertBackendCandidateFromApi(updated);
                }
                await loadInterviews();
                alert(`Candidate marked as ${decision}.`);
            } catch (error) {
                alert(`Could not update candidate decision: ${error.message}`);
            }
        }

        async function scheduleInterviewFromInterviewsTab() {
            try {
                await refreshJobsFromBackend();
                if (!backendJobs || backendJobs.length === 0) {
                    alert('No jobs found. Create or sync jobs first.');
                    return;
                }

                const jobPrompt = backendJobs
                    .map(job => `${job.id}: ${job.title}`)
                    .join('\n');
                const jobIdInput = prompt(`Enter job ID for interview scheduling:\n${jobPrompt}`, String(backendJobs[0].id));
                if (!jobIdInput) return;
                const jobId = Number(jobIdInput);
                if (!jobId || !backendJobs.some(job => job.id === jobId)) {
                    alert('Invalid job ID.');
                    return;
                }

                const jobCandidates = await apiRequest(`/jobs/${jobId}/candidates?sort=latest`);
                if (!jobCandidates.length) {
                    alert('No candidates found for this job.');
                    return;
                }

                const candidatePrompt = jobCandidates
                    .map(candidate => `${candidate.id}: ${candidate.full_name || candidate.file_name}`)
                    .join('\n');
                const candidateIdInput = prompt(`Enter candidate ID:\n${candidatePrompt}`, String(jobCandidates[0].id));
                if (!candidateIdInput) return;
                const candidateId = Number(candidateIdInput);
                const selectedCandidate = jobCandidates.find(candidate => candidate.id === candidateId);
                if (!selectedCandidate) {
                    alert('Invalid candidate ID.');
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

                const updated = await apiRequest(`/jobs/${jobId}/candidates/${candidateId}/interviews`, {
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

                if (typeof upsertBackendCandidateFromApi === 'function') {
                    upsertBackendCandidateFromApi(updated);
                }
                await loadInterviews();
                alert(`Interview scheduled for ${selectedCandidate.full_name || selectedCandidate.file_name}.`);
            } catch (error) {
                alert(`Could not schedule interview: ${error.message}`);
            }
        }

