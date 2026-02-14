        // Bulk Upload Functions
        function handleBulkUpload(event) {
            const files = event.target.files;
            if (files.length === 0) return;

            uploadedFiles = Array.from(files);
            displayUploadedFiles();
            document.getElementById('uploadedFilesList').style.display = 'block';
            document.getElementById('screeningOptionsCard').style.display = 'block';
            document.getElementById('startScreeningBtn').style.display = 'inline-flex';
        }

        function displayUploadedFiles() {
            const container = document.getElementById('fileItems');
            document.getElementById('fileCount').textContent = uploadedFiles.length;
            
            container.innerHTML = uploadedFiles.map((file, index) => `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-icon">${file.name.endsWith('.pdf') ? '📄' : '📝'}</div>
                        <div class="file-details">
                            <div class="file-name">${file.name}</div>
                            <div class="file-meta">${(file.size / 1024).toFixed(2)} KB</div>
                            <div class="progress-bar" id="progress-${index}">
                                <div class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="file-status" id="status-${index}">
                        <span class="badge badge-new">Ready</span>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-sm btn-danger" onclick="removeFile(${index})">Remove</button>
                    </div>
                </div>
            `).join('');
        }

        function removeFile(index) {
            uploadedFiles.splice(index, 1);
            displayUploadedFiles();
            if (uploadedFiles.length === 0) {
                document.getElementById('uploadedFilesList').style.display = 'none';
                document.getElementById('screeningOptionsCard').style.display = 'none';
                document.getElementById('startScreeningBtn').style.display = 'none';
            }
        }

        function splitSkills(input) {
            if (!input) return [];
            return input.split(',').map(s => s.trim()).filter(Boolean);
        }

        async function apiRequest(path, options = {}) {
            const response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
            });

            if (!response.ok) {
                let message = `Request failed: ${response.status}`;
                try {
                    const err = await response.json();
                    if (err && err.detail) message = err.detail;
                } catch (_) {}
                throw new Error(message);
            }
            return response.json();
        }

        async function createScreeningJobFromForm() {
            const role = document.getElementById('bulkScreeningRole').value || 'General Role';
            const minExperience = Number(document.getElementById('bulkMinExperience').value || 0);
            const requiredSkills = splitSkills(document.getElementById('bulkRequiredSkills').value);
            const jd = document.getElementById('bulkJD').value || `Hiring for ${role}`;

            return apiRequest('/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: role,
                    description: jd,
                    must_have_skills: requiredSkills,
                    nice_to_have_skills: [],
                    min_experience_years: minExperience,
                    location: ''
                })
            });
        }

        function setUploadRowState(index, label, progress) {
            const progressBar = document.getElementById(`progress-${index}`);
            const statusBadge = document.getElementById(`status-${index}`);

            if (progressBar) {
                progressBar.querySelector('.progress-fill').style.width = `${progress}%`;
            }
            if (statusBadge) {
                let badgeClass = 'badge-new';
                if (label === 'Screened') badgeClass = 'badge-success';
                if (label === 'Failed') badgeClass = 'badge-danger';
                if (label === 'Queued') badgeClass = 'badge-screening';
                statusBadge.innerHTML = `<span class="badge ${badgeClass}">${label}</span>`;
            }
        }

        function renderLoadingResults(message) {
            const container = document.getElementById('screeningResults');
            container.innerHTML = `
                <div class="card" style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
                    <div>${message}</div>
                </div>
            `;
        }

        async function refreshCandidatesForJob(jobId) {
            const candidatesData = await apiRequest(`/jobs/${jobId}/candidates?sort=score_desc`);
            screeningResults = candidatesData.map(candidate => ({
                id: candidate.id,
                jobId: candidate.job_id,
                name: candidate.full_name || candidate.file_name,
                email: candidate.email || 'Not found',
                role: candidate.role || 'Unknown Role',
                exp: candidate.experience_years || 0,
                skills: candidate.skills || [],
                score: candidate.final_score || 0,
                semanticScore: candidate.semantic_score || 0,
                mustHaveScore: candidate.must_have_score || 0,
                niceToHaveScore: candidate.nice_to_have_score || 0,
                recommendation: candidate.recommendation || 'Pending',
                matchedSkills: candidate.skills || [],
                fileName: candidate.file_name,
                matchReasons: candidate.match_reasons || []
            }));
            displayScreeningResults();
        }

        async function pollScreeningStatus(jobId) {
            if (screeningPollTimer) clearInterval(screeningPollTimer);

            screeningPollTimer = setInterval(async () => {
                try {
                    const status = await apiRequest(`/jobs/${jobId}/processing-status`);
                    const total = status.total || uploadedFiles.length;
                    const processed = (status.completed || 0) + (status.failed || 0);

                    uploadedFiles.forEach((_, idx) => {
                        if (idx < (status.completed || 0)) {
                            setUploadRowState(idx, 'Screened', 100);
                        } else if (idx < processed) {
                            setUploadRowState(idx, 'Failed', 100);
                        } else if (idx < total) {
                            setUploadRowState(idx, 'Queued', 35);
                        }
                    });

                    renderLoadingResults(
                        `Processing resumes... ${processed}/${total} completed (success: ${status.completed}, failed: ${status.failed})`
                    );

                    await refreshCandidatesForJob(jobId);

                    if (processed >= total && total > 0) {
                        clearInterval(screeningPollTimer);
                        screeningPollTimer = null;
                    }
                } catch (error) {
                    clearInterval(screeningPollTimer);
                    screeningPollTimer = null;
                    alert(`Status polling failed: ${error.message}`);
                }
            }, 2000);
        }

        async function startBulkScreening() {
            if (uploadedFiles.length === 0) {
                alert('Please upload at least one resume.');
                return;
            }

            document.getElementById('screeningResultsCard').style.display = 'block';
            screeningResults = [];
            renderLoadingResults('Creating job and uploading resumes...');

            try {
                uploadedFiles.forEach((_, idx) => setUploadRowState(idx, 'Uploading', 15));

                const job = await createScreeningJobFromForm();
                activeScreeningJobId = job.id;
                await refreshJobsFromBackend(activeScreeningJobId);

                const formData = new FormData();
                uploadedFiles.forEach(file => formData.append('files', file));

                const uploadResult = await apiRequest(`/jobs/${activeScreeningJobId}/resumes/bulk-upload`, {
                    method: 'POST',
                    body: formData
                });

                uploadedFiles.forEach((_, idx) => setUploadRowState(idx, 'Queued', 35));
                renderLoadingResults(`Uploaded ${uploadResult.accepted_files} resumes. Starting AI screening...`);

                await refreshCandidatesForJob(activeScreeningJobId);
                await loadCandidates({
                    status: document.getElementById('statusFilter')?.value || '',
                    source: document.getElementById('sourceFilter')?.value || '',
                    role: document.getElementById('roleFilter')?.value || '',
                    search: document.getElementById('candidateSearch')?.value || ''
                });
                await pollScreeningStatus(activeScreeningJobId);
            } catch (error) {
                alert(
                    `Could not start screening: ${error.message}. Make sure backend is running at ${API_BASE_URL}.`
                );
            }
        }

        function displayScreeningResults() {
            const container = document.getElementById('screeningResults');
            const sortedResults = screeningResults.sort((a, b) => b.score - a.score);

            if (sortedResults.length === 0) {
                container.innerHTML = `
                    <div class="card" style="text-align: center; padding: 2rem;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                        <div>No screened candidates yet.</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = sortedResults.map((result, idx) => `
                <div class="screening-card">
                    <div class="screening-header">
                        <div>
                            <div class="screening-name">${result.name}</div>
                            <div class="candidate-role">${result.role} • ${result.exp} years experience</div>
                        </div>
                        <div>
                            <div class="match-score ${result.score >= 85 ? 'high' : result.score >= 70 ? 'medium' : 'low'}">
                                🎯 ${Number(result.score).toFixed(1)}% Match
                            </div>
                        </div>
                    </div>
                    <div class="candidate-meta">
                        <span class="candidate-meta-item">📧 ${result.email}</span>
                        <span class="candidate-meta-item">📄 ${result.fileName}</span>
                        <span class="candidate-meta-item">✅ ${result.recommendation}</span>
                    </div>
                    <div class="screening-skills">
                        <strong>Skills:</strong>
                        ${(result.skills || []).map(skill =>
                            `<span class="skill-tag ${result.matchedSkills.includes(skill) ? 'matched' : ''}">${skill}</span>`
                        ).join('')}
                    </div>
                    <div class="candidate-meta mt-1">
                        <span class="candidate-meta-item"><strong>Scores:</strong> Semantic ${Number(result.semanticScore).toFixed(1)}% | Must-have ${Number(result.mustHaveScore).toFixed(1)}% | Nice-to-have ${Number(result.niceToHaveScore).toFixed(1)}%</span>
                    </div>
                    ${(result.matchReasons || []).length ? `
                        <div class="candidate-meta mt-1">
                            <span class="candidate-meta-item"><strong>Why matched:</strong> ${(result.matchReasons || []).join(' | ')}</span>
                        </div>
                    ` : ''}
                    <div class="action-buttons mt-2">
                        ${result.recommendation === 'Shortlist' ? 
                            `<button class="btn btn-sm btn-success" onclick="approveCandidateByIndex(${idx})">✓ Shortlisted</button>` :
                            result.recommendation === 'Consider' ?
                            `<button class="btn btn-sm btn-secondary" onclick="reviewCandidateByIndex(${idx})">Review</button>` :
                            `<button class="btn btn-sm btn-danger" onclick="rejectCandidateByIndex(${idx})">Reject</button>`
                        }
                        ${result.recommendation !== 'Shortlist' ? `<button class="btn btn-sm btn-success" onclick="approveCandidateByIndex(${idx})">Shortlist</button>` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="viewResumeByIndex(${idx})">View Resume</button>
                        <button class="btn btn-sm btn-primary" onclick="addToSystemByIndex(${idx})">Add to System</button>
                    </div>
                </div>
            `).join('');
        }

        async function approveAllShortlisted() {
            const canUpdate = screeningResults.filter(r => r.jobId && r.id && r.recommendation !== 'Reject');
            if (canUpdate.length === 0) {
                alert('No candidates available to shortlist.');
                return;
            }

            try {
                await Promise.all(
                    canUpdate.map(r => updateBackendCandidate(r.jobId, r.id, 'Shortlist'))
                );
                if (activeScreeningJobId) {
                    await refreshCandidatesForJob(activeScreeningJobId);
                }
                await loadCandidates({
                    status: document.getElementById('statusFilter')?.value || '',
                    source: document.getElementById('sourceFilter')?.value || '',
                    role: document.getElementById('roleFilter')?.value || '',
                    search: document.getElementById('candidateSearch')?.value || ''
                });
                alert(`Shortlisted ${canUpdate.length} candidates successfully.`);
            } catch (error) {
                alert(`Could not shortlist all candidates: ${error.message}`);
            }
        }

        function exportScreeningResults() {
            if (screeningResults.length === 0) {
                alert('No screening results to export.');
                return;
            }

            const rows = [
                ['Name', 'Email', 'Role', 'Experience', 'Score', 'Recommendation', 'File Name', 'Skills'],
                ...screeningResults.map(r => [
                    r.name,
                    r.email,
                    r.role,
                    r.exp,
                    r.score,
                    r.recommendation,
                    r.fileName,
                    (r.skills || []).join('; ')
                ])
            ];

            const csv = rows.map(cols =>
                cols.map(col => `"${String(col ?? '').replace(/"/g, '""')}"`).join(',')
            ).join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'screening-results.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }

        async function approveCandidate(name, jobId = null, candidateId = null) {
            if (!jobId || !candidateId) {
                alert(`${name} approved and added to candidate pipeline!`);
                return;
            }
            await updateBackendCandidate(jobId, candidateId, 'Shortlist');
            await refreshCandidatesForJob(jobId);
            await loadCandidates({
                status: document.getElementById('statusFilter')?.value || '',
                source: document.getElementById('sourceFilter')?.value || '',
                role: document.getElementById('roleFilter')?.value || '',
                search: document.getElementById('candidateSearch')?.value || ''
            });
        }

        async function reviewCandidate(name, jobId = null, candidateId = null) {
            if (!jobId || !candidateId) {
                alert(`${name} marked for manual review.`);
                return;
            }
            await updateBackendCandidate(jobId, candidateId, 'Consider');
            await refreshCandidatesForJob(jobId);
            await loadCandidates({
                status: document.getElementById('statusFilter')?.value || '',
                source: document.getElementById('sourceFilter')?.value || '',
                role: document.getElementById('roleFilter')?.value || '',
                search: document.getElementById('candidateSearch')?.value || ''
            });
        }

        async function rejectCandidate(name, jobId = null, candidateId = null) {
            if (!jobId || !candidateId) {
                alert(`${name} rejected. Rejection email will be sent.`);
                return;
            }
            await updateBackendCandidate(jobId, candidateId, 'Reject');
            await refreshCandidatesForJob(jobId);
            await loadCandidates({
                status: document.getElementById('statusFilter')?.value || '',
                source: document.getElementById('sourceFilter')?.value || '',
                role: document.getElementById('roleFilter')?.value || '',
                search: document.getElementById('candidateSearch')?.value || ''
            });
        }

        async function approveCandidateByIndex(index) {
            const result = screeningResults[index];
            if (!result) return;
            try {
                await approveCandidate(result.name, result.jobId, result.id);
            } catch (error) {
                alert(`Could not shortlist candidate: ${error.message}`);
            }
        }

        async function reviewCandidateByIndex(index) {
            const result = screeningResults[index];
            if (!result) return;
            try {
                await reviewCandidate(result.name, result.jobId, result.id);
            } catch (error) {
                alert(`Could not update candidate: ${error.message}`);
            }
        }

        async function rejectCandidateByIndex(index) {
            const result = screeningResults[index];
            if (!result) return;
            try {
                await rejectCandidate(result.name, result.jobId, result.id);
            } catch (error) {
                alert(`Could not reject candidate: ${error.message}`);
            }
        }

        async function shortlistFromCandidates(jobId, candidateId) {
            try {
                await updateBackendCandidate(jobId, candidateId, 'Shortlist');
                await loadCandidates({
                    status: document.getElementById('statusFilter')?.value || '',
                    source: document.getElementById('sourceFilter')?.value || '',
                    role: document.getElementById('roleFilter')?.value || '',
                    search: document.getElementById('candidateSearch')?.value || ''
                });
                if (activeScreeningJobId && Number(activeScreeningJobId) === Number(jobId)) {
                    await refreshCandidatesForJob(jobId);
                }
            } catch (error) {
                alert(`Could not shortlist candidate: ${error.message}`);
            }
        }

        async function rejectFromCandidates(jobId, candidateId) {
            try {
                await updateBackendCandidate(jobId, candidateId, 'Reject');
                await loadCandidates({
                    status: document.getElementById('statusFilter')?.value || '',
                    source: document.getElementById('sourceFilter')?.value || '',
                    role: document.getElementById('roleFilter')?.value || '',
                    search: document.getElementById('candidateSearch')?.value || ''
                });
                if (activeScreeningJobId && Number(activeScreeningJobId) === Number(jobId)) {
                    await refreshCandidatesForJob(jobId);
                }
            } catch (error) {
                alert(`Could not reject candidate: ${error.message}`);
            }
        }

        function viewResume(fileName) {
            alert(`Opening resume: ${fileName}`);
        }

        function viewResumeByIndex(index) {
            const result = screeningResults[index];
            if (!result) return;
            if (!result.jobId || !result.id) {
                viewResume(result.fileName);
                return;
            }
            const resumeUrl = `${API_BASE_URL}/jobs/${result.jobId}/candidates/${result.id}/resume`;
            window.open(resumeUrl, '_blank');
        }

        function addToSystem(name, email, role) {
            alert(`${name} (${email}) added as ${role} to the candidate management system!`);
        }

        async function addToSystemByIndex(index) {
            const result = screeningResults[index];
            if (!result) return;
            if (result.jobId && result.id) {
                try {
                    await updateBackendCandidate(result.jobId, result.id, 'Shortlist');
                    await refreshCandidatesForJob(result.jobId);
                    await loadCandidates({
                        status: document.getElementById('statusFilter')?.value || '',
                        source: document.getElementById('sourceFilter')?.value || '',
                        role: document.getElementById('roleFilter')?.value || '',
                        search: document.getElementById('candidateSearch')?.value || ''
                    });
                    alert(`${result.name} added to shortlisted candidates.`);
                    return;
                } catch (error) {
                    alert(`Could not add to system: ${error.message}`);
                    return;
                }
            }
            addToSystem(result.name, result.email, result.role);
        }

