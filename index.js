const puppeteer = require('puppeteer');
const reader = require("readline-sync");

const vaccineSearchScraper = (async (url, postcode) => {
    console.log('Process successfully launched');
    const browser = await puppeteer.launch({ headless: true });
    const site = url;
    const page = await browser.newPage();

    await page.goto(
        site,
        { waitUntil: 'load' }
    );

    await page.focus('#StepControls_0__Model_Value')
    await page.keyboard.type(postcode);

    await page.evaluate(() => {
        document.getElementsByClassName('next-button')[0].click()
    })

    await page.waitForSelector('.next-button');

    await page.evaluate(() => {
        document.getElementsByClassName('next-button')[0].click()
    })

    await page.waitForSelector('.nhsuk-card');

    const numberOfResults = await page.evaluate(() => {
        const resultsPanels = document.getElementsByClassName('QflowObjectItem');
        return resultsPanels.length;
    })

    console.log(`Now processing ${numberOfResults} results`);

    const data = [];

    for (let i = 0; i < numberOfResults; i++) {
        const payload = []
        const milesAndLocation = await page.evaluate((i) => {
            const links = document.getElementsByClassName('QflowObjectItem');

            const elChildren = links[i].children;

            const milesText = elChildren[0].innerText;
            const miles = `${milesText[0]}${milesText[1]}`;

            if (links && links[i] && elChildren) {
                elChildren[1].children[0].click();
            }

            return {
                miles,
                location: elChildren[1].innerText
            }
        }, i)

        await delay(2000);

        const dates = await page.evaluate(() => {
            const labels = document.querySelectorAll('label');
            const datesArray = [];
            Array.from(labels).forEach(label => {
                if (label && label.children) {
                    datesArray.push(label.children[0].innerText);
                }
            })

            return datesArray.join(', ');
        })

        payload.push({...milesAndLocation, dates})
        data.push(...payload);

        if (i > 0) {
            console.log(`${percentage(i, numberOfResults)}% completed`);
        }

        await page.goBack();
    }

    console.table(data);
    process.exit(1)
})

function percentage(partialValue, totalValue) {
    return Math.floor((100 * partialValue) / totalValue);
 }

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
 }

 const getUserInput = async () => {
    const url = reader.question('Please enter the url: ', {
        hideEchoBack: true
    });

    const postcode = reader.question('Please enter your postcode: ', {
        hideEchoBack: true
    });

    vaccineSearchScraper(url, postcode);
}

getUserInput();