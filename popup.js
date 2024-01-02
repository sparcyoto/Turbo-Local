; (() => {
  // ============
  // ELEMENTS
  // ============

  /**
   * @type {HTMLSelectElement}
   */
  const websiteFromInputElement = document.getElementById("from");

  /**
   * @type {HTMLElement}
   */
  const websiteFromErrorElement =
    websiteFromInputElement.parentElement.querySelector(".error");

  /**
   * @type {HTMLSelectElement}
   */
  const websiteToInputElement = document.getElementById("to");

  /**
   * @type {HTMLElement}
   */
  const websiteToErrorElement =
    websiteToInputElement.parentElement.querySelector(".error");

  /**
   * @type {HTMLButtonElement}
   */
  const transferButton = document.getElementById("transfer");

  const localhost3001 = document.getElementById("localhost3001");
  const localhost3000 = document.getElementById("localhost3000");


  //buttons
  const btnLocalhost3000 = document.getElementById("btnLocalhost3000");
  const btnLocalhost3001 = document.getElementById("btnLocalhost3001");




  // ===========
  // INIT
  // ===========





  (async () => {
    await injectAvailableTabs();
    injectInitialTabValues();
  })();

  async function injectAvailableTabs() {
    const tabs = await chrome.tabs.query({});
    // alert(chrome.tabs)


    for (const tab of tabs) {
      // const url = tabs.url;
      const url = truncateUrl(tab.url);
      console.log('abc', { tab, abc: tab.url, url, sub: tab.url.substr(0, 150) })


      // const url = truncateUrl(tab.url);
      if (!url) continue;

      const node = document.createElement("option");
      node.value = url;
      node.textContent = tab.url.substr(0, 120);

      websiteFromInputElement.appendChild(node.cloneNode(true));
      websiteToInputElement.appendChild(node.cloneNode(true));
    }
  }


  function injectInitialTabValues() {
    chrome.storage.sync.get(["lstFromWebsite"], (res) => {
      websiteFromInputElement.value = res.lstFromWebsite;
    });
    chrome.storage.sync.get(["lstToWebsite"], (res) => {
      websiteToInputElement.value = res.lstToWebsite;
    });
  }

  function getUrlParamList(url) {

    const partUrl = url.split('?');
    const param = partUrl[0] || [];
    const queryString = partUrl[1] || [];

    const paramList = param.split('/');
    const validParamList = paramList.slice(3);


    return {
      urlParamList: validParamList,
      queryString
    };
  }

  function getLocalFinalUrl(url, localBaseUrl = 'http://localhost:3001/') {

    const { urlParamList, queryString } = getUrlParamList(url);

    const finalUrl = localBaseUrl + urlParamList.join('/') + '?' + queryString;

    return finalUrl
  }

  async function constructUrl() {
    const tabs = await chrome.tabs.query({});

    const url1 = tabs[0].url;

    // const url1 = 'https://acuracertified-stage.aecloud.io/shopping/checkout/creditApplication?abc=10&bb=20'
    // const url1 = window.location.href;

    const finalUrl = getLocalFinalUrl(url1);

    console.log('kk', finalUrl)

    localhost3001.value = getLocalFinalUrl(url1, 'http://localhost:3001/');
    localhost3000.value = getLocalFinalUrl(url1, 'http://localhost:3000/');

  }

  (async () => {
    await constructUrl();
  })();

  function openLocalUrl(value) {
    window.open(value)
  }

  function injectAccordian() {

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
      });
    }
  }

  injectAccordian();

  const sleep = m => new Promise(r => setTimeout(r, m))


  const vals = 'http://localhost:3001/acuracpo/shopping/checkout/creditApplication?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZWFsZXJOYW1lIjpudWxsLCJkZWFsZXJJZCI6IjIwNjUiLCJpc3MiOiJUT0tFTl9HRU5FUkFUSU9OX1NFUlZJQ0UiLCJhc3NldFR5cGUiOiJTQ1giLCJyZWNlaXZlcklkIjoiLTEiLCJhc3NldElkIjoiMTA3NjM4IiwicmVjZWl2ZXJUeXBlIjoiQ1VTVE9NRVIiLCJ1bmlxIjoiN2NhM2IzNGUtNzhiYy00YmU0LWJiODgtMDdiOGY3ZTg0M2M0IiwidGVuYW50SWQiOiJob25kYTEiLCJleHAiOjE3MzQ2MTE5NDUsImRlcGFydG1lbnQiOm51bGwsImlhdCI6MTcwMzA3NTk0NSwiYXBwbGljYXRpb25OYW1lIjoiQ09OU1VNRVJfUE9SVEFMIn0.jhZgnXhaMGw6oaoaU0NJ6bP4G2ijd6dUx7EO2vycqgk'

  function getAllStorageSyncData() {
    // Immediately return a promise and start asynchronous work
    return new Promise((resolve, reject) => {
      // Asynchronously fetch all data from storage.sync.
      chrome.storage.sync.get(null, (items) => {
        // Pass any observed errors down the promise chain.
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        // Pass the data retrieved from storage down the promise chain.
        resolve(items);
      });
    });
  }

  async function abc() {
    const sessionData = await getAllStorageSyncData();
    const tabs = await chrome.tabs.query({});
    console.log('session', sessionData)

    // alert()

    const finalLocalUrl = getLocalFinalUrl(tabs[0].url)


    sleep(2000).then(async () => {
      const tabs = await chrome.tabs.query({});

      for (const tab of tabs) {
        // alert(tab.url)
        if (tab.url.includes('localhost')) {

          console.log('abc includes', tab)
          return
        }
      }
      window.open(window.location.href)
      window.location.href = finalLocalUrl
    })
  }

  (async () => {
    await abc();
  })();




  // ==============
  // METHODS
  // ==============

  /**
   * Handle transfer for click listener.
   *
   * This will let the background process know about our action
   * and do the job on that side.
   */


  /**
   * Handle data validation and error.
   * @returns {boolean} Whether data is valid.
   */
  function handleValidation() {
    // Validate error on all fields.
    const errors = validateFields(websiteFromInputElement, websiteToInputElement);

    const hasError = !!errors.length;
    if (!hasError) return true;

    // Displaying the error on the related fields.
    for (let index = 0; index < errors.length; index++) {
      const error = errors[index];
      const element = errorFieldsMapping.findByName(error);
      showErrorOnElement(element);
    }

    return false;
  }

  /**
   * @param {HTMLElement} element
   */
  function clearError(element) {
    return () => {
      hideErrorOnElement(element);
    };
  }

  // ===================
  // EVENT LISTENERS
  // ===================

  transferButton.addEventListener("click", handleTransfer);
  btnLocalhost3000.addEventListener("click", () => openLocalUrl(localhost3000.value))
  btnLocalhost3001.addEventListener("click", () => openLocalUrl(localhost3001.value))
  websiteFromInputElement.addEventListener(
    "change",
    clearError(websiteFromErrorElement)
  );
  websiteToInputElement.addEventListener(
    "change",
    clearError(websiteToErrorElement)
  );

  // ===================
  // HELPERS
  // ===================

  /**
   * Truncate website URL to be just a domain name with protocol.
   *
   * Example:
   *   - https://google.com/search?q=google -> https://google.com
   *   - http://localhost:4200/auth/login -> http://localhost:4200
   *
   * @param {string} url Website URL
   * @returns {string | undefined} Truncated URL
   */
  function truncateUrl(url) {
    const regex = new RegExp("^((https?)://)([-.:A-Za-z0-9])+");
    const res = url.match(regex);
    if (!res?.length) return;
    return res[0];
  }

  const errorFieldsMapping = mappingElementsByName({
    from: websiteFromErrorElement,
    to: websiteToErrorElement,
  });


  const session = 'session'
  const local = 'local'

  async function getActiveTabURL(url) {
    const [tab] = await chrome.tabs.query({ url: normalizeUrl(url) });

    return tab;
  }


  function normalizeUrl(url) {
    return url + "/*";
  }

  function getDomainStorageData(typeOfStorage = 'local') {

    console.log('out getDomainStorageData')

    try {
      const selectedStorage =
        typeOfStorage === 'local' ? localStorage : sessionStorage
      const values = []
      if (selectedStorage) {
        for (let i = 0; i < selectedStorage?.length; i++) {
          const key = selectedStorage.key(i)
          const selectedStorageObject = {
            [key]: selectedStorage.getItem(key),
          }
          values.push(selectedStorageObject)
        }
      }
      console.log(
        'getDomainStorageData-typeOfStorage-values',
        typeOfStorage,
        values?.length || 0
      )
      return values
    } catch (err) {
      console.error(
        'Error occured in getDomainStorageData',
        typeOfStorage,
        err
      )
    }
  }




  const getSessionStorageBtn = async () => {

    const activeTab = await getActiveTabURL(websiteFromInputElement?.value)
    const tabId = activeTab?.id

    console.log('out', activeTab, tabId)
    // console.log('out')


    // await clearExtensionStorage(local)

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: getDomainStorageData,
        args: [session], // passing typeOfStorage to getDomainStorageData func
      },
      (injectionResults) => {
        try {
          console.log(
            'injectionResults of getSessionStorageBtn.addEventListener',
            injectionResults[0]?.result?.length ?? 0,
            injectionResults
          )
          for (const frameResult of injectionResults) {
            const result = frameResult?.result || []
            chrome.storage.local.set({
              session: result,
            })
          }
        } catch (err) {
          console.error(
            'Error occured in injectionResults of getSessionStorageBtn.addEventListener',
            err
          )
        }
      }
    )
  }

  function setDomainStorageData(typeOfStorage = 'session') {
    try {
      const selectedStorage =
        typeOfStorage === 'local' ? localStorage : sessionStorage

      console.log('DSFAFSDFSADF')
      if (selectedStorage) {
        chrome.storage.local.get(typeOfStorage, function (items) {
          if (items[typeOfStorage]) {
            for (const storage of items[typeOfStorage]) {
              const objKey = Object.keys(storage)
              selectedStorage.setItem(
                objKey[0],
                storage[objKey]
              )
            }
          }
        })
      }
    } catch (err) {
      console.error(
        'Error occured in setDomainStorageData',
        typeOfStorage,
        err
      )
    }
  }

  const setSessionStorageBtn = async () => {
    const activeTab = await getActiveTabURL(websiteToInputElement?.value)

    console.log('This tab information', activeTab)
    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: setDomainStorageData,
        args: [session], // passing typeOfStorage to setDomainStorageData func
      },
      (injectionResults) => {
        try {
          console.log('Setting SessionStorage Successfull', injectionResults)
        } catch (err) {
          console.error(
            'Error occured in injectionResults of setStoragehandler',
            err
          )
        }
      }
    )
  };


  async function handleTransfer() {
    await getSessionStorageBtn();
    await setSessionStorageBtn()
    // return;


    const valid = handleValidation();
    if (!valid) return;

    // Tell background process that we're gonna do an action,
    // and it will do that job for us.
    console.log('before', websiteToInputElement.value, 'http://localhost:3001')
    await chrome.runtime.sendMessage({
      action: "transfer",
      field: {
        fromWebsite: websiteFromInputElement.value,
        toWebsite: websiteToInputElement.value,
        // toWebsite: 'http://localhost:3001',
      },
    });
  }

  // http://localhost:3001/acuracpo/shopping/checkout/creditApplication?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkZWFsZXJOYW1lIjpudWxsLCJkZWFsZXJJZCI6IjIwNjUiLCJpc3MiOiJUT0tFTl9HRU5FUkFUSU9OX1NFUlZJQ0UiLCJhc3NldFR5cGUiOiJTQ1giLCJyZWNlaXZlcklkIjoiLTEiLCJhc3NldElkIjoiMTA3NjM4IiwicmVjZWl2ZXJUeXBlIjoiQ1VTVE9NRVIiLCJ1bmlxIjoiN2NhM2IzNGUtNzhiYy00YmU0LWJiODgtMDdiOGY3ZTg0M2M0IiwidGVuYW50SWQiOiJob25kYTEiLCJleHAiOjE3MzQ2MTE5NDUsImRlcGFydG1lbnQiOm51bGwsImlhdCI6MTcwMzA3NTk0NSwiYXBwbGljYXRpb25OYW1lIjoiQ09OU1VNRVJfUE9SVEFMIn0.jhZgnXhaMGw6oaoaU0NJ6bP4G2ijd6dUx7EO2vycqgk



  // chrome-extension://npjlmigimipbhjlkffmodemclbpoihki/popup.html

})()