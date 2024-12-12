let map; // Declare map as a global variable
let geoLayer; // To store and remove the existing GeoJSON layer
let legend; // To store and remove the existing legend
// Navigation data structure
const POPULATION_SUBCATEGORIES = {
    totalPopulation: 'total-population',
    malePopulation: 'male-population',
    femalePopulation: 'femail-population',
    malePopulationPercentage: 'male-population-percentage',
    femalePopulationPercentage: 'female-population-percentage'
}
const mapDataCategories = [
    {
        label: 'Population',
        id: 'population',
        dataPath: 'data/dzongkhag-population.json',
        subsections: [
            {
                label: 'Total Population',
                id: POPULATION_SUBCATEGORIES.totalPopulation,
            },
            {
                label: "Population By Male",
                id: POPULATION_SUBCATEGORIES.malePopulation
            },
            {
                label: "Population By Female",
                id: POPULATION_SUBCATEGORIES.femalePopulation
            },
            {
                label: "Male Population Percentage",
                id: POPULATION_SUBCATEGORIES.malePopulationPercentage
            },
            {
                label: "Female Population Percentage",
                id: POPULATION_SUBCATEGORIES.femalePopulationPercentage
            }
        ]
    },
    {
        label: 'Economy',
        id: 'economy',
        subsections: [],
    },
    {
        label: 'Environment',
        id: 'environment',
        subsections: []
    }
];

let activeSubCategory = null;

function createNavigation() {
    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.id = 'map-data-nav';
    navContainer.className = 'map-data-nav';

    // Create navigation header
    const navHeader = document.createElement('div');
    navHeader.className = 'nav-header';
    navHeader.innerHTML = '<h2>Bhutan Data Explorer</h2>';
    navContainer.appendChild(navHeader);

    // Create navigation menu
    const navMenu = document.createElement('nav');
    navMenu.className = 'nav-menu';

    // Iterate through main categories
    mapDataCategories.forEach((categoryData) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'nav-category';
        const categoryLabel = document.createElement('div');
        categoryLabel.addEventListener('click', (e) => {
            categorySection.classList.toggle('expanded');
        })
        categoryLabel.className = 'nav-category-label';
        categoryLabel.textContent = categoryData.label;
        categorySection.appendChild(categoryLabel);
        const subsectionsContainer = document.createElement('div');
        subsectionsContainer.className = 'nav-subsections';
        categoryData.subsections.forEach((subData) => {
            const subsectionItem = document.createElement('div');
            subsectionItem.id = subData.id;
            subsectionItem.className = 'nav-subsection-item';
            subsectionItem.textContent = subData.label;
            subsectionItem.addEventListener('click', (e) => {
                if (activeSubCategory) {
                    activeSubCategory.classList.remove('active');
                }
                activeSubCategory = subsectionItem;
                subsectionItem.classList.add('active');
                loadData(categoryData.dataPath, subData.id)
            })
            subsectionsContainer.appendChild(subsectionItem);
        });
        categorySection.appendChild(subsectionsContainer);
        navMenu.appendChild(categorySection);
    })
    navContainer.appendChild(navMenu);
    const mapContainer = document.getElementById('map');
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(navContainer);


}

function getPopulationColors(d, selectedSubcategory) {
    const numbersWise = d > 100000 ? '#800026' :
        d > 60000 ? '#BD0026' :
            d > 35000 ? '#E31A1C' :
                d > 15000 ? '#FC4E2A' :
                    d > 5000 ? '#FD8D3C' :
                        d > 2000 ? '#FEB24C' :
                            '#FFEDA0';
    const percentageWise = d > 60 ? '#FF5733' :
        d > 55 ? '#FF6F61' :
            d > 50 ? '#FF8D72' :
                d > 45 ? '#FFA07A' :
                    d > 40 ? '#FFB6C1' :
                        d > 35 ? '#FFDAB9' :
                            d > 30 ? '#FFE4B5' :
                                d > 25 ? '#FFFACD' :
                                    d > 20 ? '#FFFFE0' :
                                        '#FFFFFF';
    switch (selectedSubcategory) {
        case POPULATION_SUBCATEGORIES.totalPopulation:
            return numbersWise
        case POPULATION_SUBCATEGORIES.malePopulation:
            return numbersWise
        case POPULATION_SUBCATEGORIES.femalePopulation:
            return numbersWise
        case POPULATION_SUBCATEGORIES.malePopulationPercentage:
            return percentageWise
        case POPULATION_SUBCATEGORIES.femalePopulationPercentage:
            return percentageWise
    }
}

const PERCENTAGE_WISE_SUBCATEGORIES = [POPULATION_SUBCATEGORIES.malePopulationPercentage, POPULATION_SUBCATEGORIES.femalePopulationPercentage];

const formatNumber = (number) => {
    const userLocale = window.navigator.language;
    return new Intl.NumberFormat(userLocale, { maximumFractionDigits: 1 }).format(number);
}

function loadData(dataPath = 'data/dzongkhag-population.json', selectedSubcategory = 'total-population') {
    // Remove existing map if it exists
    if (map) {
        map.remove();
    }

    Promise.all([
        d3.json("gadm41_BTN_1.json"),
        d3.json(dataPath)
    ])
        .then(([geoJsonData, populationData]) => {
            createNavigation();
            // Reinitialize map
            map = L.map('map').setView([27.5142, 90.4336], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            // Function to get color based on population
            function getColor(d) {
                return getPopulationColors(d, selectedSubcategory);
            }

            // Style function for GeoJSON layer
            function style(feature) {
                // Modify this based on the selected subcategory
                let populationValue;
                switch (selectedSubcategory) {
                    case POPULATION_SUBCATEGORIES.malePopulation:
                        populationValue = populationData[feature.properties.NAME_1]?.["Male"];
                        break;
                    case POPULATION_SUBCATEGORIES.femalePopulation:
                        populationValue = populationData[feature.properties.NAME_1]?.["Female"];
                        break;
                    case POPULATION_SUBCATEGORIES.malePopulationPercentage:
                        populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Male"] / populationData[feature.properties.NAME_1]?.["Both Sex"] * 100);
                        break;
                    case POPULATION_SUBCATEGORIES.femalePopulationPercentage:
                        populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Female"] / populationData[feature.properties.NAME_1]?.["Both Sex"] * 100);
                        break;
                    default:
                        populationValue = populationData[feature.properties.NAME_1]?.["Both Sex"];
                }

                return {
                    fillColor: getColor(populationValue),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            }

            // Remove existing legend if it exists
            if (legend) {
                map.removeControl(legend);
            }

            // Create new legend
            legend = L.control({ position: 'bottomright' });

            legend.onAdd = function (map) {
                const div = L.DomUtil.create('div', 'info legend');
                const populations = [0, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
                const percentages = [20, 25, 30, 35, 40, 45, 50, 55, 60];

                // Update legend title based on subcategory
                const legendTitles = {
                    [POPULATION_SUBCATEGORIES.totalPopulation]: 'Total Population',
                    [POPULATION_SUBCATEGORIES.malePopulation]: 'Male Population',
                    [POPULATION_SUBCATEGORIES.femalePopulation]: 'Female Population',
                    [POPULATION_SUBCATEGORIES.malePopulationPercentage]: "Male Population By Percentage",
                    [POPULATION_SUBCATEGORIES.femalePopulationPercentage]: "Female Population By Percentage"
                };

                // Legend title
                div.innerHTML += `<h4>${legendTitles[selectedSubcategory]}</h4>`;

                // Loop through population intervals and generate a label with a colored square for each interval
                const loopOver = PERCENTAGE_WISE_SUBCATEGORIES.includes(selectedSubcategory) ? percentages : populations;
                for (let i = 0; i < loopOver.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + getColor(loopOver[i] + 1) + '"></i> ' +
                        loopOver[i] + (loopOver[i + 1] ? '&ndash;' + loopOver[i + 1] + '<br>' : '+');
                }

                return div;
            };

            legend.addTo(map);

            // Remove existing GeoJSON layer if it exists
            if (geoLayer) {
                map.removeLayer(geoLayer);
            }

            // Add new GeoJSON data to the map
            geoLayer = L.geoJSON(geoJsonData, {
                style: style,
                onEachFeature: function (feature, layer) {
                    // Determine which population to display in tooltip
                    let populationValue;
                    let populationLabel;
                    switch (selectedSubcategory) {
                        case POPULATION_SUBCATEGORIES.malePopulation:
                            populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Male"]);
                            populationLabel = "Male Population"
                            break;
                        case POPULATION_SUBCATEGORIES.femalePopulation:
                            populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Female"]);
                            populationLabel = "Female Population"
                            break;
                        case POPULATION_SUBCATEGORIES.malePopulationPercentage:
                            populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Male"] / populationData[feature.properties.NAME_1]?.["Both Sex"] * 100) + "%";
                            populationLabel = "Male Population Percentage"
                            break;
                        case POPULATION_SUBCATEGORIES.femalePopulationPercentage:
                            populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Female"] / populationData[feature.properties.NAME_1]?.["Both Sex"] * 100) + "%";
                            populationLabel = "Female Population Percentage"
                            break;
                        default:
                            populationValue = formatNumber(populationData[feature.properties.NAME_1]?.["Both Sex"]);
                            populationLabel = "Total Population"
                    }

                    layer.bindTooltip(`
                        <strong>${feature.properties.NAME_1}</strong><br>
                    ${populationLabel}: ${populationValue}
                    `, {
                        permanent: false,
                        direction: 'right',
                        className: 'dzongkhag-tooltip'
                    });
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}

loadData()
