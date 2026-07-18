document.addEventListener('DOMContentLoaded', async () => {
    let countriesData = [];
    let countryA = null;
    let countryB = null;

    // Elements
    const searchAInput = document.getElementById('search-a');
    const searchBInput = document.getElementById('search-b');
    const sugA = document.getElementById('sug-a');
    const sugB = document.getElementById('sug-b');
    const btnCompare = document.getElementById('btn-compare');
    const btnRandom = document.getElementById('btn-random');
    const btnReset = document.getElementById('btn-reset');
    const heroSection = document.getElementById('hero-section');
    const resultSection = document.getElementById('result-section');
    const loading = document.getElementById('loading');
    const compGrid = document.getElementById('comparison-grid');

    // Fetch Data
    try {
        const res = await fetch('countries.json');
        countriesData = await res.json();
    } catch (error) {
        console.error('Error loading countries.json:', error);
        alert('Gagal memuat data negara. Pastikan Anda menjalankan melalui Live Server.');
    }

    // --- SEARCH & AUTOCOMPLETE LOGIC ---
    function setupSearch(inputEl, sugEl, isCountryA) {
        inputEl.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            sugEl.innerHTML = '';
            if (!val) {
                sugEl.style.display = 'none';
                return;
            }

            const matches = countriesData.filter(c => 
                c.name.toLowerCase().includes(val) || 
                c.officialName.toLowerCase().includes(val)
            );

            if (matches.length > 0) {
                sugEl.style.display = 'block';
                matches.forEach(match => {
                    const div = document.createElement('div');
                    div.innerHTML = `${match.flag} ${match.name}`;
                    div.addEventListener('click', () => {
                        inputEl.value = `${match.flag} ${match.name}`;
                        if (isCountryA) countryA = match;
                        else countryB = match;
                        sugEl.style.display = 'none';
                    });
                    sugEl.appendChild(div);
                });
            } else {
                sugEl.style.display = 'none';
            }
        });

        // Hide suggestion when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== inputEl) sugEl.style.display = 'none';
        });
    }

    setupSearch(searchAInput, sugA, true);
    setupSearch(searchBInput, sugB, false);

    // --- RANDOM COMPARE ---
    btnRandom.addEventListener('click', () => {
        if(countriesData.length < 2) return;
        const shuffled = [...countriesData].sort(() => 0.5 - Math.random());
        countryA = shuffled[0];
        countryB = shuffled[1];
        searchAInput.value = `${countryA.flag} ${countryA.name}`;
        searchBInput.value = `${countryB.flag} ${countryB.name}`;
        processCompare();
    });

    // --- COMPARE BUTTON ---
    btnCompare.addEventListener('click', () => {
        if (!countryA || !countryB) {
            alert('Silakan pilih kedua negara terlebih dahulu!');
            return;
        }
        if (countryA.id === countryB.id) {
            alert('Silakan pilih negara yang berbeda untuk dibandingkan.');
            return;
        }
        processCompare();
    });

    btnReset.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        heroSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    });

    // --- COMPARISON LOGIC ---
    function processCompare() {
        heroSection.classList.add('hidden');
        loading.classList.remove('hidden');

        // Simulate processing for UX
        setTimeout(() => {
            loading.classList.add('hidden');
            renderComparison();
            saveHistory();
            resultSection.classList.remove('hidden');
            resultSection.style.animation = 'fadeIn 0.8s ease';
        }, 1000);
    }

    function renderComparison() {
        compGrid.innerHTML = '';
        let scoreA = 0;
        let scoreB = 0;
        let winA_cats = [];
        let winB_cats = [];

        // Build UI structure
        const buildRow = (label, valA, valB, formatType, metricName = null, higherIsBetter = true) => {
            let numA = parseFloat(valA) || 0;
            let numB = parseFloat(valB) || 0;
            let winner = 0; // 0 tie, 1 A wins, 2 B wins

            if (metricName) {
                if (numA > numB) winner = higherIsBetter ? 1 : 2;
                else if (numB > numA) winner = higherIsBetter ? 2 : 1;
                
                if (winner === 1) { scoreA++; winA_cats.push(metricName); }
                else if (winner === 2) { scoreB++; winB_cats.push(metricName); }
            }

            // Formatting
            const fmtA = formatType === 'num' ? numA.toLocaleString() : valA;
            const fmtB = formatType === 'num' ? numB.toLocaleString() : valB;

            // Bar Chart Width
            const maxVal = Math.max(numA, numB);
            const pctA = maxVal === 0 ? 0 : (numA / maxVal) * 100;
            const pctB = maxVal === 0 ? 0 : (numB / maxVal) * 100;

            const row = document.createElement('div');
            row.className = 'data-row glass-card';
            row.innerHTML = `
                <div class="val-a ${winner === 1 ? 'winner' : ''}">
                    ${winner === 1 ? '🏆 ' : ''} <span class="counter" data-target="${numA}">${formatType === 'num' ? '0' : fmtA}</span> ${formatType === 'prefix' ? valA : ''}
                    ${formatType === 'num' ? `<div class="bar-container"><div class="bar-fill" style="width: 0%" data-width="${pctA}%"></div></div>` : ''}
                </div>
                <div class="data-label">${label}</div>
                <div class="val-b ${winner === 2 ? 'winner' : ''}">
                    <span class="counter" data-target="${numB}">${formatType === 'num' ? '0' : fmtB}</span> ${winner === 2 ? ' 🏆' : ''} ${formatType === 'prefix' ? valB : ''}
                    ${formatType === 'num' ? `<div class="bar-container"><div class="bar-fill" style="width: 0%" data-width="${pctB}%"></div></div>` : ''}
                </div>
            `;
            compGrid.appendChild(row);
        };

        const buildCategory = (title) => {
            const titleEl = document.createElement('div');
            titleEl.className = 'category-title';
            titleEl.innerText = title;
            compGrid.appendChild(titleEl);
        }

        // Header Row (Flags)
        const headerRow = document.createElement('div');
        headerRow.className = 'data-row';
        headerRow.style.background = 'transparent';
        headerRow.style.border = 'none';
        headerRow.innerHTML = `
            <div class="val-a" style="font-size: 2rem;">${countryA.flag} <h2>${countryA.name}</h2></div>
            <div class="data-label" style="font-size: 1.5rem;">VS</div>
            <div class="val-b" style="font-size: 2rem;">${countryB.flag} <h2>${countryB.name}</h2></div>
        `;
        compGrid.appendChild(headerRow);

        // General
        buildCategory('General Information');
        buildRow('Capital', countryA.capital, countryB.capital, 'text');
        buildRow('Continent', countryA.continent, countryB.continent, 'text');
        
        // Economy
        buildCategory('Economy & Demographics');
        buildRow('Population', countryA.population, countryB.population, 'num', 'Populasi');
        buildRow('Area (km²)', countryA.area, countryB.area, 'num', 'Luas Wilayah');
        buildRow('GDP ($)', countryA.economy.gdp, countryB.economy.gdp, 'num', 'GDP (Ekonomi)');
        buildRow('GDP Per Capita ($)', countryA.economy.gdpPerCapita, countryB.economy.gdpPerCapita, 'num', 'Kesejahteraan');

        // Tech & Internet
        buildCategory('Technology & Connectivity');
        buildRow('Internet Users', countryA.technology.internetUsers, countryB.technology.internetUsers, 'num', 'Pengguna Internet');
        buildRow('Internet Speed (Mbps)', countryA.technology.internetSpeed, countryB.technology.internetSpeed, 'num', 'Kecepatan Internet');

        // Military
        buildCategory('Military Power');
        buildRow('Active Personnel', countryA.military.activePersonnel, countryB.military.activePersonnel, 'num', 'Personil Militer');
        buildRow('Defense Budget ($)', countryA.military.defenseBudget, countryB.military.defenseBudget, 'num', 'Anggaran Militer');

        // Animate Counters and Bars
        animateData();

        // Render Fun Facts
        renderFunFacts();

        // Generate Summary
        generateSummary(scoreA, scoreB, winA_cats, winB_cats);
    }

    function animateData() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            if(isNaN(target)) return;
            const inc = target / 100;
            let c = 0;
            const updateCounter = () => {
                c += inc;
                if (c < target) {
                    counter.innerText = Math.ceil(c).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target.toLocaleString();
                }
            };
            updateCounter();
        });

        // Animate Bars
        setTimeout(() => {
            const bars = document.querySelectorAll('.bar-fill');
            bars.forEach(bar => {
                bar.style.width = bar.getAttribute('data-width');
            });
        }, 300);
    }

    function generateSummary(scoreA, scoreB, winA, winB) {
        const summaryEl = document.getElementById('auto-summary');
        const winnerEl = document.getElementById('overall-winner');

        let textA = winA.length > 0 ? `${countryA.name} unggul dalam: ${winA.slice(0, 3).join(', ')}.` : '';
        let textB = winB.length > 0 ? `${countryB.name} memimpin di sektor: ${winB.slice(0, 3).join(', ')}.` : '';
        
        summaryEl.innerText = `${textA} ${textB}`;

        if (scoreA > scoreB) {
            winnerEl.innerHTML = `🌟 Pemenang Keseluruhan: <strong>${countryA.name}</strong>`;
        } else if (scoreB > scoreA) {
            winnerEl.innerHTML = `🌟 Pemenang Keseluruhan: <strong>${countryB.name}</strong>`;
        } else {
            winnerEl.innerHTML = `⚖️ Hasil Seimbang (Draw)`;
        }
    }

    function renderFunFacts() {
        const ffA = document.getElementById('fun-fact-a');
        const ffB = document.getElementById('fun-fact-b');

        const listA = countryA.funFacts.map(f => `<li>${f}</li>`).join('');
        const listB = countryB.funFacts.map(f => `<li>${f}</li>`).join('');

        ffA.innerHTML = `<h3>💡 Fakta Unik ${countryA.name}</h3><ul>${listA}</ul>`;
        ffB.innerHTML = `<h3>💡 Fakta Unik ${countryB.name}</h3><ul>${listB}</ul>`;
    }

    // --- SHARE & EXPORT NATIVE API ---
    document.getElementById('btn-share').addEventListener('click', async () => {
        const shareData = {
            title: `XAERISOFT | ${countryA.name} VS ${countryB.name}`,
            text: `Lihat perbandingan antara ${countryA.name} dan ${countryB.name}! Pemenangnya adalah...`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                alert('Browser Anda tidak mendukung Web Share API. Coba Export PDF.');
            }
        } catch (err) {
            console.error(err);
        }
    });

    // --- LOCAL STORAGE (HISTORY) ---
    function saveHistory() {
        let history = JSON.parse(localStorage.getItem('xs_history')) || [];
        const entry = `${countryA.name} vs ${countryB.name}`;
        if (!history.includes(entry)) {
            history.unshift(entry);
            if(history.length > 5) history.pop();
            localStorage.setItem('xs_history', JSON.stringify(history));
        }
    }

    document.getElementById('btn-history').addEventListener('click', () => {
        const history = JSON.parse(localStorage.getItem('xs_history')) || [];
        if (history.length === 0) {
            alert('History kosong.');
        } else {
            alert('Riwayat Compare Terakhir:\n\n' + history.join('\n'));
        }
    });

    document.getElementById('btn-favorite').addEventListener('click', () => {
        alert('Fitur favorit dapat diakses setelah login (Data disimpan di LocalStorage).');
    });

    document.getElementById('btn-fav-current').addEventListener('click', () => {
        alert(`Perbandingan ${countryA.name} vs ${countryB.name} ditambahkan ke Favorit! ⭐`);
    });
});
