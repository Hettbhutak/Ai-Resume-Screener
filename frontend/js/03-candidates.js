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

        function loadInterviews() {
            // Sample interviews data
            const scheduledContainer = document.getElementById('scheduledInterviews');
            scheduledContainer.innerHTML = `
                <div class="candidate-card">
                    <div class="candidate-header">
                        <div>
                            <div class="candidate-name">Sarah Johnson - Technical Round 2</div>
                            <div class="candidate-role">Senior Developer</div>
                        </div>
                        <div>
                            <span class="badge badge-interview">Today, 2:00 PM</span>
                        </div>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">👤 Interviewer: Rahul Mehta</span>
                        <span class="candidate-meta-item">🕐 Duration: 60 min</span>
                        <span class="candidate-meta-item">💻 Mode: Video Call</span>
                    </div>
                    <div class="action-buttons mt-2">
                        <button class="btn btn-sm btn-primary">Join Meeting</button>
                        <button class="btn btn-sm btn-secondary">Reschedule</button>
                    </div>
                </div>
            `;

            const pendingContainer = document.getElementById('pendingFeedbackList');
            pendingContainer.innerHTML = `
                <div class="candidate-card">
                    <div class="candidate-header">
                        <div>
                            <div class="candidate-name">Raj Kumar - Manager Round</div>
                            <div class="candidate-role">DevOps Engineer</div>
                        </div>
                        <div>
                            <span class="badge badge-warning">Feedback Pending</span>
                        </div>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">👤 Interviewer: Priya Joshi</span>
                        <span class="candidate-meta-item">📅 Completed: 2 hours ago</span>
                    </div>
                    <div class="action-buttons mt-2">
                        <button class="btn btn-sm btn-primary" onclick="showModal('feedbackModal')">Add Feedback</button>
                    </div>
                </div>
            `;
        }

