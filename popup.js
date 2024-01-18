; (() => {
  // ============
  // ELEMENTS
  // ============

  /**
   * @type {HTMLSelectElement}
   */
  const startupLocalTansferDoneMessage = document.getElementById("startupLocalTansferDoneMessage");
  const websiteFromInputElement = document.getElementById("from");
  const startupLocalGeneration = document.getElementById("startupLocalGeneration");
  const startupSubmit = document.getElementById("startupSubmit");
  const startupLocalGenerationRadio = document.getElementById("startupLocalGenerationRadio");

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

  const panelInside = document.getElementById("panelAcc")
  /**
   * @type {HTMLButtonElement}
   */
  const transferButton = document.getElementById("transfer");

  const clearLocalStorage = document.getElementById("clearLocalStorage");
  const clearSessionStorage = document.getElementById("clearSessionStorage");
  const clearCookiesStorage = document.getElementById("clearCookiesStorage");
  const reloadPage = document.getElementById("reloadPage");

  const localhost3001 = document.getElementById("localhost3001");
  const localhost3000 = document.getElementById("localhost3000");


  // constanst

  const STARTUP_ITEM = {
    'AUTO_SELECTED_LOCAL_STARTUP': 'AUTO_SELECTED_LOCAL_STARTUP',
  };

  // ===========
  // INIT
  // ===========

  (async () => {
    await injectAvailableTabs();
    await injectInitialTabValues();
    await getLocalGenerationDataFromChromeStorage();
    await getStartupLocalGenerationFromChromeStorage();

    // startup item to get local tabs detail to automatically transfer data
    await getSaveLocalDevelopmentOnChromeStorage();
  })();

  async function getActiveTabURL(tabDetails) {
    const tabDetailsParsed = JSON.parse(tabDetails);
    const [tab] = await chrome.tabs.query({ index: tabDetailsParsed?.index });
    // const [tab] = await chrome.tabs.query({ windowId: tabDetailsParsed?.id });
    // const [tab] = await chrome.tabs.query({ lastFocusedWindow: tabDetailsParsed?.lastAccessed });

    console.log('active', tab, JSON.parse(tabDetails))

    return tab;
  }

  let data = {};
  let startupLocalGenerationData = []

  async function getLocalGenerationDataFromChromeStorage() {
    chrome.storage.sync.get(['localGenerationData'], (result) => {
      data = result?.localGenerationData || {}
    });
  }

  async function getStartupLocalGenerationFromChromeStorage() {
    await chrome.storage.sync.get('startupLocalGenerationData', (result) => {
      startupLocalGenerationData = result?.startupLocalGenerationData || []

      runStarupItems();
    });
  }

  async function removedSavedLocalDevelopmentItemOnChromeStorage(fromTab, toTab, done) {
    if (!fromTab || !toTab) return;

    console.log('getSaveLocalDevelopmentOnChromeStorage remove', { fromTab, toTab, done })
    const fromUrl = fromTab?.url;
    const toUrl = toTab?.url;


    await chrome.storage.sync.get('localGeneratedStartupData', (result = {}) => {

      chrome.storage.sync.set(
        {
          localGeneratedStartupData: {
            ...(result?.localGeneratedStartupData),// might be case multiple local generated for different sites
            [toUrl]: { fromUrl: fromUrl, toUrl: toUrl, done }
          },
        }
      );
    });

    if (done) {
      startupLocalTansferDoneMessage.innerHTML = 'Automatic Transfered storages to "Active Local Url" &#9989; &#9989;';

      setTimeout(() => {
        startupLocalTansferDoneMessage.innerHTML = '';
      }, 3000)
    }
  }

  async function saveLocalDevelopmentOnChromeStorage(activeUrl, localUrl) {
    let foundStartupStorage = false;

    // alert(activeUrl)


    await chrome.storage.sync.get('localGeneratedStartupData', (result = {}) => {
      foundStartupStorage = true;
      chrome.storage.sync.set(
        {
          localGeneratedStartupData: {
            ...(result?.localGeneratedStartupData),// might be case multiple local generated for different sites
            [localUrl]: { fromUrl: activeUrl, toUrl: localUrl, done: false }
          },
        }
      );
    });

    if (!foundStartupStorage) {

      chrome.storage.sync.set(
        {
          localGeneratedStartupData: {
            [localUrl]: { fromUrl: activeUrl, toUrl: localUrl, done: false }
          },
        }
      );
    }

  }

  async function getSaveLocalDevelopmentOnChromeStorage() {

    await chrome.storage.sync.get('localGeneratedStartupData', async (result = {}) => {

      Object.entries(result?.localGeneratedStartupData || {}).forEach(async ([key, value]) => {
        const { fromUrl, toUrl, done } = value || {};
        // const { fromUrl, toUrl, done } = data[1];
        if (done) return;


        const [fromTab] = await chrome.tabs.query({ url: fromUrl });
        const [toTab] = await chrome.tabs.query({ url: toUrl });

        console.log('getSaveLocalDevelopmentOnChromeStorage', { key, result, fromUrl, toUrl, done, fromTab, toTab });
        if (!fromTab || !toTab) return;


        await getCookiesStorageFromSelectedFromTab(fromTab, toTab);
        await setCookiesStorageFromSelectedFromTab(fromTab, toTab);
        await getSessionStorageBtn(fromTab, toTab);
        await setSessionStorageBtn(fromTab, toTab)

        await getLocalStorage(fromTab, toTab);
        await setLocalStorage(fromTab, toTab);
      })

    });

    // chrome.storage.sync.set(
    //   {
    //     localGeneratedStartupData: {}
    //   }
    // );
  }



  const handleMakeLocalAndChangeUrl = async (inputValue, initialValue, indexInDataDetails, baseUrl) => {
    saveLocalDevelopmentOnChromeStorage(JSON.parse(websiteFromInputElement?.value)?.url, inputValue)
    if (inputValue === initialValue) window.open(inputValue);


    console.log('saveLocalDevelopmentOnChromeStorage', { inputValue, initialValue, indexInDataDetails, baseUrl })


    const inputValueParam = inputValue.split('?');

    const fromUrl = getLocalFinalUrl(JSON.parse(websiteFromInputElement.value).url).split('?')[0];
    const fromUrlList = fromUrl.split('/')
    const inputValueList = inputValueParam[0].split('/');

    const fromUrlQueryToObject = convertQueryToObeject(getLocalFinalUrl(JSON.parse(websiteFromInputElement.value).url).split('?')[1]);
    const inputValueQueryToObject = convertQueryToObeject(inputValueParam[1]);

    const modifiedQueryDetails = {};
    Object.entries(inputValueQueryToObject).map(([key, value]) => {
      if (fromUrlQueryToObject[key] != value) modifiedQueryDetails[key] = value;
    })

    console.log('input', inputValueList, fromUrlList);

    const modifiedList = []
    let i = 3, j = 3;

    while (i < fromUrlList.length && j < inputValueList.length) {

      if (fromUrlList[i] != inputValueList[j]) {
        modifiedList.push({ postion: i, value: inputValueList[j] });
        j++;
      }

      i++; j++;
    }

    while (j < inputValueList.length) {
      modifiedList.push({ postion: i, value: inputValueList[j] });

      j++; i++;
    }

    data[baseUrl][indexInDataDetails] = { ...data[baseUrl][indexInDataDetails], mod: modifiedList, modifiedQueryDetails }

    chrome.storage.sync.set(
      {
        localGenerationData: data,
      }
    );


    console.log('final', { modifiedList, data, base: data[baseUrl][indexInDataDetails] })

    // setTimeout(localGeneration, 600);
    window.open(inputValue);
  }

  function makeUrlFromDataModifiedList(modifiedList, port, modifiedQueryDetails = {}, fullUrl) {
    // const fullUrl = JSON.parse(websiteFromInputElement.value).url;
    const fromUrl = getLocalFinalUrl(fullUrl, port).split('?')[0];
    const fromUrlList = fromUrl.split('/')

    let i = 0, j = 0;

    var generatedFinalurlList = [];

    while (i < fromUrlList.length && j < modifiedList.length) {
      if (i != modifiedList[j].postion) {
        generatedFinalurlList.push(fromUrlList[i] + '/')
        i++;
      } else {
        generatedFinalurlList.push(modifiedList[j].value + '/')
        j++;
      }
    }

    while (i < fromUrlList.length) {
      generatedFinalurlList.push(fromUrlList[i] + '/')
      i++;
    }

    while (j < modifiedList.length) {
      generatedFinalurlList.push(modifiedList[j].value + '/')
      j++;
    }

    // this contain only params 
    let finalMakeUrlFromDataModifiedList = generatedFinalurlList.join('').slice(0, -1);

    const fromUrlQueryToObject = convertQueryToObeject(getLocalFinalUrl(fullUrl).split('?')[1]);
    const finalQueryObject = { ...modifiedQueryDetails, ...fromUrlQueryToObject };

    const finalQueryString = convertObjectToQueryString(finalQueryObject);

    const finalQueryStringWithQuestionMark = finalQueryString ? '?' + finalQueryString : ''


    console.log('makeUrlFromDataModifiedList', modifiedList, generatedFinalurlList, generatedFinalurlList.join('').slice(0, -1));


    return finalMakeUrlFromDataModifiedList + finalQueryStringWithQuestionMark;
  }

  // const finalUrlFormDataModifiedList = makeUrlFromDataModifiedList([{ postion: 3, value: 'honda' }, { postion: 6, value: 'asdada' }])


  async function handleAddPortToGenerateLocalList(port) {
    const fromUrl = JSON.parse(websiteFromInputElement.value).url;

    const { baseUrl } = getUrlParamList(fromUrl);


    await chrome.storage.sync.get('localGenerationData', async (result) => {
      var localGenerationData = {};
      localGenerationData = result?.localGenerationData || {};

      const baseUrlDetails = localGenerationData[baseUrl] || [];
      baseUrlDetails.push({ port, mod: [] })

      const finalLocalGenerationData = { ...localGenerationData, [baseUrl]: baseUrlDetails }

      console.log('abc', { localGenerationData, finalLocalGenerationData });

      await chrome.storage.sync.set({
        localGenerationData: finalLocalGenerationData
      })

      data = finalLocalGenerationData;
    });

  }

  async function renderGeneratePort() {

    const label = document.createElement("div");
    label.innerHTML = 'Enter Port No.'
    label.classList.add('portLabel')

    const input = document.createElement("input");
    input.value = '3001';
    input.classList.add('portInput')

    const button = document.createElement("button");
    button.innerHTML = 'Create Port';
    button.classList.add('hoverButton')
    const div = document.createElement("div");

    button.onclick = async () => {
      await handleAddPortToGenerateLocalList(input.value);
      panelInside.innerHTML = '';
      console.log('final data', input.value, data)
      setTimeout(localGeneration, 500);
    }

    div.appendChild(label)
    div.appendChild(input);
    div.appendChild(button);


    div.classList.add('flex')

    panelInside.appendChild(div)

  }

  async function localGeneration() {
    if (!websiteFromInputElement.value) return;

    console.log('abc called ZZZZ')

    const node = document.createElement("div");
    panelInside.appendChild(node)

    const fromUrl = JSON.parse(websiteFromInputElement?.value)?.url;

    const { baseUrl } = getUrlParamList(fromUrl);

    // clearing startup auto local generation select element
    startupLocalGeneration.innerHTML = '';

    data[baseUrl]?.forEach((val, index) => {
      const input = document.createElement("input");
      // input.value = val.url
      const finalUrlFormDataModifiedList = makeUrlFromDataModifiedList(val?.mod, val?.port, val?.modifiedQueryDetails, fromUrl)
      input.value = finalUrlFormDataModifiedList;

      const button = document.createElement("button");
      button.textContent = 'make local';
      button.classList.add('hoverButton')

      console.log('input', input)
      input.onchange = async () => handleMakeLocalAndChangeUrl(input.value, val, index, baseUrl);
      button.onclick = async () => { handleMakeLocalAndChangeUrl(input.value, val, index, baseUrl) }

      const div = document.createElement("div");

      div.appendChild(input);
      div.appendChild(button);

      div.classList.add('flex')

      panelInside.appendChild(div);


      // injecting options in startup auto local generation

      const node = document.createElement("option");
      node.value = JSON.stringify(val);
      node.textContent = finalUrlFormDataModifiedList?.substr(0, 120);

      console.log('abc called ZZZZ', finalUrlFormDataModifiedList)

      startupLocalGeneration.appendChild(node.cloneNode(true));
    })


    renderGeneratePort()

  }


  async function injectAvailableTabs() {
    const tabs = await chrome.tabs.query({});
    // const [activeTab] = await chrome.tabs.query({ currentWindow: true, active: true });
    // alert(activeTab.url);
    console.log('all', tabs)
    // alert(chrome.tabs)
    // tabs.sort((a, b) => a.url.localeCompare(b.url))


    for (const tab of tabs) {
      // const url = tabs.url;
      const url = truncateUrl(tab.url);
      console.log('abc', { tab, abc: tab.url, url, sub: tab.url.substr(0, 150) })

      // const url = truncateUrl(tab.url);
      if (!url) continue;

      const node = document.createElement("option");
      node.value = JSON.stringify({ index: tab.index, url: tab.url });
      node.textContent = tab.url.substr(0, 120);

      websiteFromInputElement.appendChild(node.cloneNode(true));
      websiteToInputElement.appendChild(node.cloneNode(true));
      // startupLocalGeneration.appendChild(node.cloneNode(true));
    }
  }

  async function automaticLocalGenerationBasedOnStartupItem({ baseUrl: storedStartupBaseUrl, modifiedListForUrl }) {
    const [activeTab] = await chrome.tabs.query({ currentWindow: true, active: true });
    const { baseUrl } = getUrlParamList(activeTab?.url);
    // marking the radio checked if it is selectedStorage
    startupLocalGenerationRadio.checked = true;

    if (baseUrl != storedStartupBaseUrl) return;

    const tabs = await chrome.tabs.query({});
    let isChromeExtensionOpened = false;

    tabs.forEach(tab => {
      if (tab?.url?.includes('chrome-extension://')) isChromeExtensionOpened = true;
    })


    // if we dont't have saved data for current base domain

    const finalGeneratedUrl = makeUrlFromDataModifiedList(modifiedListForUrl?.mod, modifiedListForUrl?.port, modifiedListForUrl?.modifiedQueryDetails, activeTab?.url);


    console.log('startup gen', { baseUrl, storedStartupBaseUrl, finalGeneratedUrl, isChromeExtensionOpened, tabs })

    // alert(finalGeneratedUrl);
    // if (baseUrl != storedStartupBaseUrl) return;
    // setTimeout(() => { window.open(finalGeneratedUrl); }, 0);

    // window.open(finalGeneratedUrl);

    const handleOpenfinalGeneratedurl = (finalGeneratedUrl, isChromeExtensionOpened, extensionUrl) => {
      console.log('asdadasda', finalGeneratedUrl)
      window.open(finalGeneratedUrl);
      // if (!isChromeExtensionOpened) window.open(extensionUrl)
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab?.id },
        func: handleOpenfinalGeneratedurl,
        args: [finalGeneratedUrl, isChromeExtensionOpened, window.location.href], // passing typeOfStorage to setDomainStorageData func
      }
    )


  }

  const startupItemVshandler = {
    [STARTUP_ITEM.AUTO_SELECTED_LOCAL_STARTUP]: automaticLocalGenerationBasedOnStartupItem
  }

  async function runStarupItems() {
    // check if startUpItem is present

    console.log('STARTUP', startupLocalGenerationData)
    startupLocalGenerationData.forEach(async startupLocalGenerationItem => {
      const { startUpItem, baseUrl, modifiedListForUrl } = startupLocalGenerationItem || {};

      const handler = startupItemVshandler[startUpItem];

      await handler({ startUpItem, baseUrl, modifiedListForUrl })
    })
  }


  async function injectInitialTabValues() {
    const [activeTab] = await chrome.tabs.query({ currentWindow: true, active: true });
    // const [activeTab] = await chrome.tabs.query({ index: 0 });


    const isLocalHostUrl = activeTab.url.includes('localhost');
    const isExtension = activeTab.url.includes('chrome-extension://')

    console.log("kk", activeTab, isExtension)


    chrome.storage.sync.get(["prevFromWebsite"], (res) => {
      // websiteFromInputElement.value = res.prevFromWebsite;
      // console.log('kk', JSON.parse(res.prevFromWebsite), isLocalHostUrl, (isLocalHostUrl && res.prevFromWebsite) || JSON.stringify(activeTab));
      websiteFromInputElement.value = (isLocalHostUrl && res.prevFromWebsite) || JSON.stringify({ index: activeTab.index, url: activeTab.url });

      if (isExtension) websiteFromInputElement.value = res.prevFromWebsite;
    });
    chrome.storage.sync.get(["prevToWebsite"], (res) => {
      // alert((isLocalHostUrl && JSON.stringify(activeTab)) || res.prevToWebsite)
      console.log('kk', res.prevToWebsite)
      websiteToInputElement.value = (isLocalHostUrl && JSON.stringify({ index: activeTab.index, url: activeTab.url })) || res.prevToWebsite;
      if (isExtension) websiteToInputElement.value = res.prevToWebsite;
    });
  }

  function getUrlParamList(url) {

    const partUrl = url.split('?');
    const param = partUrl[0] || [];
    const queryString = partUrl[1] || [];

    const paramList = param.split('/');
    const validParamList = paramList.slice(3);
    const baseUrlList = paramList.slice(0, 3)

    return {
      baseUrlList,
      baseUrl: baseUrlList.join('/'),
      urlParamList: validParamList,
      queryString
    };
  }

  function getLocalFinalUrl(url, port = '3000') {

    const { urlParamList, queryString } = getUrlParamList(url);

    const finalUrl = `http://localhost:${port}/` + urlParamList.join('/') + '?' + queryString;

    return finalUrl
  }

  // async function constructUrl() {
  //   if (!websiteFromInputElement?.value) return;
  //   const tabs = await getActiveTabURL(websiteFromInputElement?.value);

  //   console.log('kk', tabs, websiteFromInputElement?.value)

  //   // return;

  //   const url1 = tabs.url;

  //   // const url1 = 'https://acuracertified-stage.aecloud.io/shopping/checkout/creditApplication?abc=10&bb=20'
  //   // const url1 = window.location.href;

  //   const finalUrl = getLocalFinalUrl(url1);


  //   localhost3001.value = getLocalFinalUrl(url1, '3001');
  //   localhost3000.value = getLocalFinalUrl(url1, '3000');

  // }

  // constructUrl()
  // (async () => {
  //   await constructUrl();
  // })()

  function openLocalUrl(value) {
    window.open(value)
  }

  function injectAccordian() {

    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function () {
        // for the accordian to refresh content
        panelInside.innerHTML = '';
        localGeneration()

        // constructUrl()
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

  // async function abc() {
  //   const sessionData = await getAllStorageSyncData();
  //   const tabs = await chrome.tabs.query({});
  //   console.log('session', sessionData)

  //   // alert()

  //   const finalLocalUrl = getLocalFinalUrl(tabs[0].url)


  //   sleep(2000).then(async () => {
  //     const tabs = await chrome.tabs.query({});

  //     for (const tab of tabs) {
  //       // alert(tab.url)
  //       if (tab.url.includes('localhost')) {

  //         console.log('abc includes', tab)
  //         return
  //       }
  //     }
  //     window.open(window.location.href)
  //     window.location.href = finalLocalUrl
  //   })
  // }

  // (async () => {
  //   await abc();
  // })();







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
      panelInside.innerHTML = '';
      localGeneration();

      hideErrorOnElement(element);
    };
  }


  async function handleClearLocalStorage(params) {
    if (!websiteFromInputElement?.value) return;
    const activeTab = await getActiveTabURL(websiteFromInputElement?.value);

    const handleClearLocal = () => localStorage.clear();

    console.log('clear local', { activeTab, websiteFromInputElementCookieData })
    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: handleClearLocal,
        args: [], // passing typeOfStorage to setDomainStorageData func
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
  }
  async function handleClearSessionStorage(params) {
    if (!websiteFromInputElement?.value) return;
    const activeTab = await getActiveTabURL(websiteFromInputElement?.value);

    const handleClearSession = () => sessionStorage.clear();

    console.log('clear session', { activeTab, websiteFromInputElementCookieData })
    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: handleClearSession,
        args: [], // passing typeOfStorage to setDomainStorageData func
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
  }
  async function handleClearCookiesStorage(params) {
    if (!websiteFromInputElement?.value) return;
    const activeTab = await getActiveTabURL(websiteFromInputElement?.value);

    const handleClearCookies = () => {
      var cookies = document.cookie.split("; ");
      for (var c = 0; c < cookies.length; c++) {
        var d = window.location.hostname.split(".");
        while (d.length > 0) {
          var cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
          var p = location.pathname.split('/');
          document.cookie = cookieBase + '/';
          while (p.length > 0) {
            document.cookie = cookieBase + p.join('/');
            p.pop();
          };
          d.shift();
        }
      }
    }

    console.log('clear cookies', { activeTab, websiteFromInputElementCookieData })
    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: handleClearCookies,
        args: [], // passing typeOfStorage to setDomainStorageData func
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

  }

  async function handleReloadPage() {
    if (!websiteFromInputElement?.value) return;
    const activeTab = await getActiveTabURL(websiteFromInputElement?.value);

    const handleReload = () => window.location.reload();

    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: handleReload,
        args: [],
      }, () => { })
  }


  async function handleStartupSubmit(params) {
    console.log('abc', startupLocalGenerationRadio.value, startupLocalGenerationRadio.checked, startupLocalGeneration.value);

    if (startupLocalGenerationRadio.checked) {
      const startupLocalGenerationDetails = JSON.parse(startupLocalGeneration.value);

      const fromUrl = JSON.parse(websiteFromInputElement?.value)?.url;
      const { baseUrl } = getUrlParamList(fromUrl);
      // const url = makeUrlFromDataModifiedList(startupLocalGenerationDetails);

      console.log('zzzz', 'sada', startupLocalGenerationDetails);

      chrome.storage.sync.set(
        {
          startupLocalGenerationData: [...startupLocalGenerationData,
          { startUpItem: STARTUP_ITEM.AUTO_SELECTED_LOCAL_STARTUP, baseUrl, modifiedListForUrl: startupLocalGenerationDetails }],
        }
      );
    }

    // if uncheckecd remove that data from chrome storage
    if (!startupLocalGenerationRadio.checked) {
      chrome.storage.sync.set(
        {
          startupLocalGenerationData: startupLocalGenerationData.filter(val => val.startUpItem != STARTUP_ITEM.AUTO_SELECTED_LOCAL_STARTUP)
        }
      );
    }

  }



  // ===================
  // EVENT LISTENERS
  // ===================


  websiteFromInputElement.addEventListener(
    "change",
    clearError(websiteFromErrorElement)
  );
  websiteToInputElement.addEventListener(
    "change",
    clearError(websiteToErrorElement)
  );


  transferButton.addEventListener("click", handleTransfer);

  clearLocalStorage.addEventListener('click', handleClearLocalStorage)
  clearSessionStorage.addEventListener('click', handleClearSessionStorage)
  clearCookiesStorage.addEventListener('click', handleClearCookiesStorage)
  reloadPage.addEventListener('click', handleReloadPage)

  startupSubmit.addEventListener('click', handleStartupSubmit)

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

  var websiteFromInputElementCookieData = '';


  const getCookiesStorage = async () => {

    try {
      var cookieData = document.cookie.split(';').map(function (c) {
        var i = c.indexOf('=');
        return [c.substring(0, i), c.substring(i + 1)];
      });

      const cookieString = JSON.stringify(JSON.stringify(cookieData));

      console.log('success cokies', cookieString)
      return cookieString;
    } catch (err) {
      console.error(
        'error in cookies',
        err
      )
    }

  }

  const getCookiesStorageFromSelectedFromTab = async (fromTab, toTab) => {

    const activeTab = fromTab || await getActiveTabURL(websiteFromInputElement?.value);
    const tabId = activeTab?.id

    console.log('out', activeTab, tabId)
    // console.log('out')


    // await clearExtensionStorage(local)

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: getCookiesStorage,
        args: [session], // passing typeOfStorage to getDomainStorageData func
      },
      (injectionResults) => {
        try {
          console.log(
            'cookies Injection',
            injectionResults
          )

          chrome.storage.local.set({
            cookies: JSON.parse(injectionResults[0]?.result),
          })
        } catch (err) {
          console.error('cookies error', err)
        }
      }
    )
  }

  const getSessionStorageBtn = async (fromTab, toTab) => {

    const activeTab = fromTab || await getActiveTabURL(websiteFromInputElement?.value)
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

      if (selectedStorage) {
        chrome.storage.local.get(typeOfStorage,
          function (items) {
            console.log('DSFAFSDFSADF', typeOfStorage, items)
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

  const getLocalStorage = async (fromTab, toTab) => {
    const activeTab = fromTab || await getActiveTabURL(websiteFromInputElement?.value)
    const tabId = activeTab?.id

    console.log('out', activeTab, tabId)
    // console.log('out')


    // await clearExtensionStorage(local)

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: getDomainStorageData,
        args: [local], // passing typeOfStorage to getDomainStorageData func
      },
      (injectionResults) => {
        try {
          console.log(
            'injectionResults of getLocalStorage',
            injectionResults
          )
          for (const frameResult of injectionResults) {
            const result = frameResult?.result || []
            chrome.storage.local.set({
              local: result,
            })
          }
        } catch (err) {
          console.error(
            'Error occured in injectionResults of getLocalStorage',
            err
          )
        }
      }
    )
  }

  const setLocalStorage = async (fromTab, toTab) => {
    const activeTab = toTab || await getActiveTabURL(websiteToInputElement?.value);

    console.log('local tab info', { activeTab, fromTab, toTab })
    const tabId = activeTab?.id
    const data = await chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: setDomainStorageData,
        args: [local], // passing typeOfStorage to setDomainStorageData func
      },
      async (injectionResults) => {
        await removedSavedLocalDevelopmentItemOnChromeStorage(fromTab, toTab, !!injectionResults)
        try {
          console.log('Setting LocalStorage Successfull', injectionResults)
        } catch (err) {
          console.error(
            'Error occured in injectionResults of LocalStorage',
            err
          )
        }
      }
    )

    console.log('LocalStorage data', data)
  };



  function setCookiesStorage() {
    chrome.storage.local.get('cookies', function (data) {

      const { cookies } = data;
      console.log('cookie setting', { data, cookies })

      var cookieData = JSON.parse(cookies);
      cookieData.forEach(function (arr) {
        document.cookie = arr[0] + '=' + arr[1];
      });


    });
  }


  const setCookiesStorageFromSelectedFromTab = async (fromTab, toTab) => {
    const activeTab = toTab || await getActiveTabURL(websiteToInputElement?.value)

    console.log('set cookies', { activeTab, websiteFromInputElementCookieData })
    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: setCookiesStorage,
        args: [], // passing typeOfStorage to setDomainStorageData func
      },
      async (injectionResults) => {
        await removedSavedLocalDevelopmentItemOnChromeStorage(fromTab, toTab, !!injectionResults)

        try {
          console.log('Setting cookies Successfull', injectionResults)
        } catch (err) {
          console.error(
            'Error occured in injectionResults of cookes handler',
            err
          )
        }
      }
    )
  };

  const setSessionStorageBtn = async (fromTab, toTab) => {
    const activeTab = toTab || await getActiveTabURL(websiteToInputElement?.value)

    console.log('This tab information', activeTab)
    const tabId = activeTab?.id
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId, allFrames: true },
        func: setDomainStorageData,
        args: [session], // passing typeOfStorage to setDomainStorageData func
      },
      async (injectionResults) => {
        await removedSavedLocalDevelopmentItemOnChromeStorage(fromTab, toTab, !!injectionResults)
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
    await getCookiesStorageFromSelectedFromTab();
    await setCookiesStorageFromSelectedFromTab();
    await getSessionStorageBtn();
    await setSessionStorageBtn()

    await getLocalStorage()
    await setLocalStorage();


    const valid = handleValidation();
    // console.log('before', websiteFromInputElement.value, JSON.parse(websiteToInputElement.value), valid)
    if (!valid) return;

    // console.log('before', websiteFromInputElement.value, JSON.parse(websiteToInputElement.value), 'http://localhost:3001')
    //setting localStorage for prev Values of select
    chrome.storage.sync.set(
      {
        prevFromWebsite: websiteFromInputElement.value,
        prevToWebsite: websiteToInputElement.value,
      }
    );

    return;


    // Tell background process that we're gonna do an action,
    // and it will do that job for us.
    await chrome.runtime.sendMessage({
      action: "transfer",
      field: {
        fromWebsite: truncateUrl(JSON.parse(websiteFromInputElement.value)?.url),
        toWebsite: truncateUrl(JSON.parse(websiteToInputElement.value)?.url),
        // toWebsite: 'http://localhost:3001',
      },
    });
  }






  // chrome-extension://npjlmigimipbhjlkffmodemclbpoihki/popup.html

})()