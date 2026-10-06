// ===================== DATA =====================
const DISTRICTS = [
    "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra",
    "Brahmanbaria", "Chandpur", "Chittagong", "Chuadanga", "Comilla",
    "CoxsBazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha",
    "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jessore", "Jhalokhati",
    "Jhenaidah", "Joypurhat", "Khagrachari", "Khulna", "Kishorganj", "Kurigram",
    "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj",
    "Meherpur", "Moulvibazar", "Munshiganj", "Mymansingh", "Naogaon", "Narail",
    "Narayanganj", "Narshingdi", "Natore", "Nawabganj", "Netrokona", "Nilphamari",
    "Noakhali", "Pabna", "Panchaghar", "Patuakhali", "Pirojpur", "Rajbari",
    "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur",
    "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

const DIVISIONS = [
    { name: "বরিশাল বিভাগ", districts: ["Barguna", "Barisal", "Bhola", "Jhalokhati", "Patuakhali", "Pirojpur"] },
    { name: "চট্টগ্রাম বিভাগ", districts: ["Bandarban", "Brahmanbaria", "Chandpur", "Chittagong", "Comilla", "CoxsBazar", "Feni", "Khagrachari", "Lakshmipur", "Noakhali", "Rangamati"] },
    { name: "ঢাকা বিভাগ", districts: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishorganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narshingdi", "Rajbari", "Shariatpur", "Tangail"] },
    { name: "খুলনা বিভাগ", districts: ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"] },
    { name: "ময়মনসিংহ বিভাগ", districts: ["Jamalpur", "Mymansingh", "Netrokona", "Sherpur"] },
    { name: "রাজশাহী বিভাগ", districts: ["Bogra", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Rajshahi", "Sirajganj"] },
    { name: "রংপুর বিভাগ", districts: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchaghar", "Rangpur", "Thakurgaon"] },
    { name: "সিলেট বিভাগ", districts: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"] }
];

const REGIONS = {
    uttor: ["Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Panchaghar", "Thakurgaon", "Rangpur", "Lalmonirhat", "Bogra", "Joypurhat", "Rajshahi", "Naogaon", "Nawabganj", "Natore", "Sirajganj", "Pabna"],
    dokkhin: ["Barisal", "Barguna", "Bhola", "Jhalokhati", "Patuakhali", "Pirojpur", "Khulna", "Bagerhat", "Satkhira", "Jessore", "Narail", "Magura", "Jhenaidah", "Kushtia", "Chuadanga", "Meherpur"]
};

const TOTAL = 64;
let visited = [];
try {
    const savedDistricts = JSON.parse(localStorage.getItem('visitedDistricts') || '[]');
    if (Array.isArray(savedDistricts)) {
        visited = savedDistricts.filter(name => DISTRICTS.includes(name));
    }
} catch {
    localStorage.removeItem('visitedDistricts');
}

// ===================== DOM REFS =====================
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressPercent = document.getElementById('progress-percent');
const tooltip = document.getElementById('tooltip');
const svgWrapper = document.getElementById('svg-wrapper');
const visitorCount = document.getElementById('visitor-count');
const visitorStatus = document.getElementById('visitor-status');
const visitorWidget = document.getElementById('visitor-widget');

// ===================== VISITOR COUNTER =====================
async function initializeVisitorCounter() {
    const setVisitorStatus = message => {
        visitorStatus.textContent = message;
        visitorWidget.title = message;
    };

    if (typeof Counter !== 'function') {
        visitorCount.textContent = '—';
        setVisitorStatus('সার্ভিস পাওয়া যাচ্ছে না');
        visitorWidget.classList.add('is-offline');
        return;
    }

    const counter = new Counter({ workspace: 'bangladesh-travel-map' });
    const sessionKey = 'bangladeshTravelVisitCounted';
    let alreadyCounted = false;
    try {
        alreadyCounted = sessionStorage.getItem(sessionKey) === 'true';
    } catch {
        // Continue without session de-duplication when storage is unavailable.
    }

    const renderCount = result => {
        visitorCount.textContent = new Intl.NumberFormat('bn-BD').format(result.value);
    };

    const refreshCount = async () => {
        const result = await counter.get('total-visits');
        renderCount(result);
    };

    try {
        const result = alreadyCounted
            ? await counter.get('total-visits')
            : await counter.up('total-visits');
        renderCount(result);
        setVisitorStatus('স্বয়ংক্রিয়');
        visitorWidget.classList.remove('is-offline');

        if (!alreadyCounted) {
            try {
                sessionStorage.setItem(sessionKey, 'true');
            } catch {
                // The counter still works when session storage is unavailable.
            }
        }

        window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refreshCount().catch(() => {
                    setVisitorStatus('আপডেট হচ্ছে না');
                    visitorWidget.classList.add('is-offline');
                });
            }
        }, 30000);
    } catch (error) {
        visitorCount.textContent = '—';
        setVisitorStatus(error.status === 404
            ? 'ওয়ার্কস্পেস নেই'
            : error.status === 401 || error.status === 403
                ? 'অনুমতি নেই'
                : 'সংযোগ নেই');
        visitorWidget.classList.add('is-offline');
        console.error('Visitor counter could not be loaded:', error);
    }
}

initializeVisitorCounter();

// ===================== PROGRESS =====================
function updateProgress() {
    const count = visited.length;
    const pct = Math.min(Math.round((count / TOTAL) * 100), 100);
    progressBar.style.width = pct + '%';
    const formatNumber = value => new Intl.NumberFormat('bn-BD').format(value);
    progressText.textContent = `${formatNumber(TOTAL)} জেলার মধ্যে ${formatNumber(count)}টি ঘোরা হয়েছে`;
    progressPercent.textContent = pct + '%';
    localStorage.setItem('visitedDistricts', JSON.stringify(visited));

    // Sync district buttons
    document.querySelectorAll('.district-btn').forEach(btn => {
        btn.classList.toggle('active', visited.includes(btn.dataset.name));
    });

    // Sync SVG paths
    document.querySelectorAll('[data-district]').forEach(el => {
        el.classList.toggle('visited', visited.includes(el.dataset.district));
    });
}

// ===================== TOGGLE =====================
function toggleDistrict(name) {
    if (!name) return;
    if (visited.includes(name)) {
        visited = visited.filter(d => d !== name);
    } else {
        visited.push(name);
    }
    updateProgress();
}

// ===================== BUILD DISTRICT BUTTONS =====================
const grid = document.getElementById('district-buttons');
DIVISIONS.forEach(division => {
    const group = document.createElement('details');
    group.className = 'division-group';

    const heading = document.createElement('summary');
    heading.className = 'division-title';
    heading.textContent = division.name;
    group.appendChild(heading);

    const buttons = document.createElement('div');
    buttons.className = 'division-buttons';
    division.districts.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'district-btn';
        btn.dataset.name = name;
        btn.textContent = name.replace(/([A-Z])/g, ' $1').trim();
        btn.addEventListener('click', () => toggleDistrict(name));
        buttons.appendChild(btn);
    });
    group.appendChild(buttons);
    group.addEventListener('toggle', () => {
        if (!group.open) return;
        grid.querySelectorAll('.division-group[open]').forEach(openGroup => {
            if (openGroup !== group) openGroup.open = false;
        });
    });
    grid.appendChild(group);
});

// ===================== LOAD SVG MAP =====================
fetch('bdmap_ovi.svg')
    .then(response => {
        if (!response.ok) throw new Error(`Map request failed: ${response.status}`);
        return response.text();
    })
    .then(svgText => {
        svgWrapper.innerHTML = svgText;

        const svg = svgWrapper.querySelector('svg');
        if (!svg) throw new Error('The map file does not contain an SVG.');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Trim the SVG viewport to the district shapes, removing unused canvas space.
        const paths = svgWrapper.querySelectorAll('[id$="_District"]');
        if (paths.length) {
            const labels = Array.from(svg.querySelectorAll('text')).map(label => {
                const box = label.getBBox();
                const matrix = svg.getScreenCTM().inverse().multiply(label.getScreenCTM());
                const corners = [
                    new DOMPoint(box.x, box.y),
                    new DOMPoint(box.x + box.width, box.y),
                    new DOMPoint(box.x, box.y + box.height),
                    new DOMPoint(box.x + box.width, box.y + box.height)
                ].map(point => point.matrixTransform(matrix));
                return {
                    x: Math.min(...corners.map(point => point.x)),
                    y: Math.min(...corners.map(point => point.y)),
                    width: Math.max(...corners.map(point => point.x)) - Math.min(...corners.map(point => point.x)),
                    height: Math.max(...corners.map(point => point.y)) - Math.min(...corners.map(point => point.y))
                };
            }).filter(label => label.width && label.height);
            const bounds = [...paths, ...labels].reduce((result, element) => {
                const { x, y, width, height } = element.getBBox ? element.getBBox() : element;
                result.minX = Math.min(result.minX, x);
                result.minY = Math.min(result.minY, y);
                result.maxX = Math.max(result.maxX, x + width);
                result.maxY = Math.max(result.maxY, y + height);
                return result;
            }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
            const padding = 8;
            svg.setAttribute('viewBox', `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.maxX - bounds.minX + padding * 2} ${bounds.maxY - bounds.minY + padding * 2}`);
        }

        // Attach events to all district paths
        paths.forEach(el => {
            // Extract district name from ID e.g. "Dhaka_District" -> "Dhaka"
            const districtName = el.id.replace('_District', '');
            el.dataset.district = districtName;
            el.classList.add('district-path');
            el.setAttribute('tabindex', '0');
            el.setAttribute('role', 'button');
            el.setAttribute('aria-label', districtName.replace(/([A-Z])/g, ' $1').trim());

            el.addEventListener('click', () => toggleDistrict(districtName));
            el.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleDistrict(districtName);
                }
            });

            el.addEventListener('mouseenter', (e) => {
                const label = districtName.replace(/([A-Z])/g, ' $1').trim();
                tooltip.textContent = label;
                tooltip.style.display = 'block';
            });

            el.addEventListener('mousemove', (e) => {
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = e.clientY + 'px';
            });

            el.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });

        updateProgress();
    })
    .catch(err => {
        svgWrapper.innerHTML = '<p class="map-error">মানচিত্র লোড হয়নি। পেজটি লোকাল সার্ভার দিয়ে খুলুন এবং bdmap_ovi.svg একই ফোল্ডারে রাখুন।</p>';
        console.error(err);
    });

// ===================== BULK SELECT BUTTONS =====================
document.getElementById('btn-uttor').addEventListener('click', () => {
    const all = REGIONS.uttor.every(d => visited.includes(d));
    REGIONS.uttor.forEach(d => {
        if (all) visited = visited.filter(v => v !== d);
        else if (!visited.includes(d)) visited.push(d);
    });
    updateProgress();
});

document.getElementById('btn-dokkhin').addEventListener('click', () => {
    const all = REGIONS.dokkhin.every(d => visited.includes(d));
    REGIONS.dokkhin.forEach(d => {
        if (all) visited = visited.filter(v => v !== d);
        else if (!visited.includes(d)) visited.push(d);
    });
    updateProgress();
});

// Clear All
document.querySelector('.btn-clear').addEventListener('click', () => {
    visited = [];
    updateProgress();
});

// ===================== DOWNLOAD =====================
document.getElementById('btn-download').addEventListener('click', () => {
    const container = document.getElementById('export-container');
    tooltip.style.display = 'none';

    html2canvas(container, {
        scale: 2,
        backgroundColor: '#f0f4f8',
        useCORS: true,
        onclone: clonedDocument => {
            const clonedNameInput = clonedDocument.getElementById('user-name');
            if (!clonedNameInput) return;

            const nameLabel = clonedDocument.createElement('span');
            nameLabel.className = clonedNameInput.className;
            nameLabel.textContent = clonedNameInput.value || clonedNameInput.placeholder;
            nameLabel.style.display = 'inline-block';
            nameLabel.style.whiteSpace = 'normal';
            nameLabel.style.overflowWrap = 'anywhere';
            clonedNameInput.replaceWith(nameLabel);
        }
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'bangladesh-travel-map.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

// ===================== PROFILE PHOTO =====================
const photoWrap = document.getElementById('photo-wrap');
const photoInput = document.getElementById('photo-input');
const profilePhoto = document.getElementById('profile-photo');
const photoPlaceholder = document.getElementById('photo-placeholder');

photoWrap.addEventListener('click', event => {
    if (event.target !== photoInput) photoInput.click();
});
photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        profilePhoto.src = ev.target.result;
        profilePhoto.style.display = 'block';
        photoPlaceholder.style.display = 'none';
        localStorage.setItem('profilePhoto', ev.target.result);
    };
    reader.readAsDataURL(file);
});

// ===================== LOAD SAVED NAME & PHOTO =====================
const savedName = localStorage.getItem('userName');
const savedPhoto = localStorage.getItem('profilePhoto');
if (savedName) document.getElementById('user-name').value = savedName;
if (savedPhoto) {
    profilePhoto.src = savedPhoto;
    profilePhoto.style.display = 'block';
    photoPlaceholder.style.display = 'none';
}

document.getElementById('user-name').addEventListener('input', e => {
    localStorage.setItem('userName', e.target.value);
});

// ===================== HEADER PHOTO SLIDESHOW =====================
const HEADER_SLIDES = [
    {
        image: 'img/bandarban.jpg',
        credit: 'Bandarban'
    },
    {
        image: 'img/bandarban_nafakum.jpg',
        credit: 'Nafakum, Bandarban'
    },
    {
        image: 'img/sajek.avif',
        credit: 'Sajek'
    },
    {
        image: 'img/sylhet.jpg',
        credit: 'Sylhet'
    }
];

const siteHeader = document.querySelector('.site-header');
const photoCredit = document.getElementById('photo-credit');
let headerSlideIndex = -1;

function showNextHeaderSlide() {
    const nextIndex = (headerSlideIndex + 1) % HEADER_SLIDES.length;
    const slide = HEADER_SLIDES[nextIndex];
    const image = new Image();

    image.onload = () => {
        siteHeader.classList.remove('photo-visible');
        window.setTimeout(() => {
            siteHeader.style.setProperty('--header-photo', `url("${slide.image}")`);
            photoCredit.textContent = `ছবি: ${slide.credit}`;
            siteHeader.classList.add('photo-visible');
            headerSlideIndex = nextIndex;
        }, 180);
    };

    image.onerror = () => {
        headerSlideIndex = nextIndex;
    };
    image.src = slide.image;
}

showNextHeaderSlide();
window.setInterval(showNextHeaderSlide, 7000);

