        // Navigation
        function navigateTo(page) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            
            document.getElementById(page).classList.add('active');
            document.querySelector(`[data-page="${page}"]`).classList.add('active');
            
            // Load page-specific content
            if (page === 'candidates') loadCandidates();
            if (page === 'talent-pool') loadTalentPool();
            if (page === 'interviews') loadInterviews();
            if (page === 'templates') loadTemplate();
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        // Modal Functions
        function showModal(modalId) {
            document.getElementById(modalId).classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Tab Functions
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        function mapRecommendationBadge(rec) {
            if (rec === 'Shortlist') return 'badge-success';
            if (rec === 'Consider') return 'badge-warning';
            if (rec === 'Reject') return 'badge-danger';
            return 'badge-screening';
        }

        async function refreshJobsFromBackend(preselectJobId = null) {
            try {
                backendJobs = await apiRequest('/jobs');
                const jobSelect = document.getElementById('jobFilter');
                if (!jobSelect) return;

                const currentValue = preselectJobId ? String(preselectJobId) : jobSelect.value;
                const options = ['<option value="">Select Job (Backend)</option>'];
                backendJobs.forEach(job => {
                    options.push(`<option value="${job.id}">#${job.id} ${job.title}</option>`);
                });
                jobSelect.innerHTML = options.join('');

                if (currentValue && backendJobs.some(j => String(j.id) === String(currentValue))) {
                    jobSelect.value = String(currentValue);
                } else if (!jobSelect.value && backendJobs.length > 0) {
                    jobSelect.value = String(backendJobs[0].id);
                }
            } catch (error) {
                console.error('Could not sync jobs:', error);
            }
        }

        async function updateBackendCandidate(jobId, candidateId, recommendation) {
            return apiRequest(`/jobs/${jobId}/candidates/${candidateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recommendation })
            });
        }

