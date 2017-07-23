var unirest = require('unirest');
var DOMParser = require('xmldom').DOMParser;
var GuestwareAPIHelper = require('../GuestwareAPIHelper');

/**
 * Create a new GuestwareSoapClient
 * @param       {String} appName       ApplicationName
 * @param       {String} versionNumber VersionNumber
 * @param       {String} appId         Application wrapper ID
 * @param       {String} username      UserName
 * @param       {String} password      PassWord
 * @constructor
 */
function GuestwareSoapClient(wsdl, appName, versionNumber, appId, username, password) {
  this.wsdl = wsdl;
  this.appName = appName;
  this.versionNumber = versionNumber;
  this.appId = appId;
  this.username = username;
  this.password = password;
  this.requestReadHeader = generateRequestReadHeader(
    this.appName,
    this.versionNumber,
    this.appId,
    this.username,
    this.password
  );
  this.requestReadFooter = generateRequestReadFooter();
  this.requestUpdateHeader = generateRequestUpdateHeader(
    this.username,
    this.password
  );
  this.requestUpdateFooter = generateRequestUpdateFooter();
  this.domParser = new DOMParser();
  this.helper = new GuestwareAPIHelper(this);

  function generateRequestUpdateHeader(username, password) {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
        '<soap:Header>',
          '<' + appId + ' xmlns="http://webservices.guestware.com/">',
            '<UserName>' + username + '</UserName>',
            '<PassWord>' + password + '</PassWord>',
          '</' + appId + '>',
        '</soap:Header>',
        '<soap:Body>'
    ];
  }

  function generateRequestUpdateFooter() {
    return [
        '</soap:Body>',
      '</soap:Envelope>'
    ];
  }

  function generateRequestReadHeader(appName, versionNumber, appId, username, password) {
    return [
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://webservices.guestware.com/">',
        '<soapenv:Header>',
          '<web:' + appId + '>',
            '<web:UserName>' + username + '</web:UserName>',
            '<web:PassWord>' + password + '</web:PassWord>',
            '<web:ApplicationName>' + appName + '</web:ApplicationName>',
            '<web:VersionNumber>' + versionNumber + '</web:VersionNumber>',
          '</web:' + appId + '>',
        '</soapenv:Header>',
        '<soapenv:Body>'
    ];
  }

  function generateRequestReadFooter() {
    return [
        '</soapenv:Body>',
      '</soapenv:Envelope>'
    ];
  }
}

/**
 * Generate a diff body for a specific SOAP diff
 * @return {Object} -> {newObject, oldObject}
 */
GuestwareSoapClient.prototype.generateUpdateElementBody = function (elementId, elementValues) {
  function generateElement (keyName, keyValue) {
    if (typeof keyValue !== 'undefined') {
      return (
        '<' + keyName + '>'
          + keyValue +
        '</' + keyName + '>'
      );
    }
  }

  var result = {
    newObject: [],
    oldObject: []
  }
  var elementType = elementValues.$$elementType;
  delete elementValues.$$elementType;
  var elementUpdateType = elementValues.$$elementUpdateType;
  delete elementValues.$$elementUpdateType;
  var valueKeys = Object.keys(elementValues);

  if (typeof elementType === 'undefined' || typeof elementUpdateType === 'undefined')
    return result;

  // Create the element XML object
  result.newObject.push('<' + elementType + ' diffgr:id="' + elementType + elementId + '" msdata:rowOrder="' + (elementId - 1) + '" diffgr:hasChanges="' + elementUpdateType  + '">');
  if (elementUpdateType === 'modified') {
    result.oldObject.push('<' + elementType + ' diffgr:id="' + elementType + elementId + '" msdata:rowOrder="' + (elementId - 1) + '">');
  }

  // Create an object for each element value provided, placing the value inside
  valueKeys.forEach(function (valueKey) {
    result.newObject.push(generateElement(valueKey, elementValues[valueKey]));
    if (elementUpdateType === 'modified') {
      result.oldObject.push(generateElement(valueKey, elementValues[valueKey]));
    }
  });

  // Close the element XML object
  result.newObject.push('</' + elementType + '>');
  if (elementUpdateType === 'modified') {
    result.oldObject.push('</' + elementType + '>');
  }

  return result;
}

/**
 * Generate a request body for a specific SOAP method
 * @return {Array}
 */
GuestwareSoapClient.prototype.generateMethodBody = function (method, args, body) {
  var body = body || [];
  var argKeys = Object.keys(args);
  // Create the method XML object
  if (typeof method !== 'undefined') body.push('<web:' + method + '>');
  // Create an object for each argument provided, placing the value inside
  argKeys.forEach(function (key) {
    if (typeof args[key] !== 'undefined') {
      body.push('<web:' + key + '>');
      body.push(args[key]);
      body.push('</web:' + key + '>');
    }
  }.bind(this));
  // Close the method XML object
  if (typeof method !== 'undefined') body.push('</web:' + method + '>');
  return body;
}

/**
 * Generate a request POST body for a SOAP update method
 * @return {Object} -> {raw, string}
 */
GuestwareSoapClient.prototype.generateUpdateRequestBody = function (method, objectName, changeList) {
  var request = [];
  var requestBodyHeader = [
    '<' + method + ' xmlns="http://webservices.guestware.com/">',
      '<' + objectName + ' xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" msdata:SchemaSerializationMode="ExcludeSchema">',
        '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns="http://webservices.guestware.com/dstGST.xsd" xmlns:msprop="urn:schemas-microsoft-com:xml-msprop" xmlns:mstns="http://webservices.guestware.com/dstGST.xsd" id="dstGST" targetNamespace="http://webservices.guestware.com/dstGST.xsd" attributeFormDefault="qualified" elementFormDefault="qualified">',
          '<xs:element name="dstGST" msdata:IsDataSet="true" msdata:UseCurrentLocale="true">',
            '<xs:complexType>',
              '<xs:choice minOccurs="0" maxOccurs="unbounded"/>',
            '</xs:complexType>',
          '</xs:element>',
        '</xs:schema>',
        '<diffgr:diffgram xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">'
  ];
  var requestBodyFooter = [
        '</diffgr:diffgram>',
      '</' + objectName + '>',
    '</' + method + '>'
  ];

  var oldList = [];
  var newList = [];
  var typeCounters = {};
  changeList.forEach(function (change, i) {
    if (typeof typeCounters[change.$$elementType] === 'undefined')
      typeCounters[change.$$elementType] = 1;
    else typeCounters[change.$$elementType]++;

    var elementBody = this.generateUpdateElementBody(typeCounters[change.$$elementType], change);
    Array.prototype.push.apply(newList, elementBody.newObject);
    if (elementBody.oldObject.length > 0) {
      Array.prototype.push.apply(oldList, elementBody.oldObject);
    }
  }.bind(this));

  Array.prototype.push.apply(request, this.requestUpdateHeader);
  Array.prototype.push.apply(request, requestBodyHeader);
  request.push('<dstGST xmlns="http://webservices.guestware.com/dstGST.xsd">');
  Array.prototype.push.apply(request, newList);
  request.push('</dstGST>');
  request.push('<diffgr:before>');
  Array.prototype.push.apply(request, oldList);
  request.push('</diffgr:before>');
  Array.prototype.push.apply(request, requestBodyFooter);
  Array.prototype.push.apply(request, this.requestUpdateFooter);

  return {
    raw: request,
    string: request.join('')
  };
}

/**
 * Generate a request POST body for a SOAP read method
 * @return {Object} -> {raw, string}
 */
GuestwareSoapClient.prototype.generateReadRequestBody = function (method, args) {
  var request = [];
  Array.prototype.push.apply(request, this.requestReadHeader);
  Array.prototype.push.apply(request, this.generateMethodBody(method, args));
  Array.prototype.push.apply(request, this.requestReadFooter);
  return {
    raw: request,
    string: request.join('')
  };
}

GuestwareSoapClient.prototype.generateRequest = function (body) {
  var wsdl = this.wsdl;
  var doc = this.domParser;
  return new Promise(function (resolve, reject) {
    unirest
    .post(wsdl)
    .headers({
      'Content-Type': 'text/xml'
    })
    .send(body)
    .end(function (response) {
      if (response.code === 200) {
        resolve({
          raw: response.body,
          parsed: doc.parseFromString(response.body, 'text/xml')
        });
      }
      else reject(response);
    });
  });
}

/**
 * Make a SOAP update request
 * @return {Promise<Object>}
 */
GuestwareSoapClient.prototype.update = function (method, objectName, changeList) {
  return this.generateRequest(this.generateUpdateRequestBody(method, objectName, changeList).string);
}

/**
 * Make a SOAP read request
 * @return {Promise<Object>}
 */
GuestwareSoapClient.prototype.read = function (method, args) {
  return this.generateRequest(this.generateReadRequestBody(method, args).string);
}

/**
 * Format the SOAP response into a readable JavaScript object format
 * @param  {DOMParser<Document>} parsedResponse
 * @param  {Object}              dataMap -> {guestwareTagName: newJavaScriptObjectKey}
 * @return {Object}
 */
GuestwareSoapClient.prototype.formatResponse = function(parsedResponse, dataMap, verbose) {
  if (dataMap.$$liTagName) {
    var liTagName = dataMap.$$liTagName;
    delete dataMap.$$liTagName;
    var dataMapKeys = Object.keys(dataMap);
    try {
      var itemList = parsedResponse.getElementsByTagName(liTagName);
    } catch (err) {
      if (verbose) console.error('[WARNING] Failed to find list item: ' + liTagName);
    }
    var resultList = [];
    for (var i = 0; i < itemList.$$length; i++) {
      var result = {};
      dataMapKeys.forEach(function (key) {
        try {
          result[key] = itemList[i].getElementsByTagName(dataMap[key])[0].firstChild.data;
        } catch (err) {
          if (verbose) console.error('[WARNING] Failed to find key: ' + key);
        }
      });
      resultList.push(result);
    }
    return resultList;
  } else {
    var result = {};
    var dataMapKeys = Object.keys(dataMap);
    dataMapKeys.forEach(function (key) {
      try {
        result[key] = itemList[i].getElementsByTagName(dataMap[key])[0].firstChild.data;
      } catch (err) {
        if (verbose) console.error('[WARNING] Failed to find key: ' + key);
      }
    });
    return result;
  }
}

/**
 * Generates a mock response from GuestWare
 * @type {Object} -> {raw, parsed}
 */
GuestwareSoapClient.prototype.mockResponse = function (methodName, data) {
  var output = [];
  var responseHeader = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">',
      '<soap:Body>',
        '<'+methodName+'Response xmlns="http://webservices.guestware.com/">',
          '<'+methodName+'Result msdata:SchemaSerializationMode="ExcludeSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">',
            '<xs:schema id="dstGST" targetNamespace="http://webservices.guestware.com/dstGST.xsd" xmlns:mstns="http://webservices.guestware.com/dstGST.xsd" xmlns="http://webservices.guestware.com/dstGST.xsd" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:msprop="urn:schemas-microsoft-com:xml-msprop" attributeFormDefault="qualified" elementFormDefault="qualified">',
              '<xs:element name="dstGST" msdata:IsDataSet="true" msdata:UseCurrentLocale="true">',
                '<xs:complexType>',
                  '<xs:choice minOccurs="0" maxOccurs="unbounded" />',
                '</xs:complexType>',
              '</xs:element>',
            '</xs:schema>',
            '<diffgr:diffgram xmlns:msdata="urn:schemas-microsoft-com:xml-msdata" xmlns:diffgr="urn:schemas-microsoft-com:xml-diffgram-v1">',
              '<dstGST xmlns="http://webservices.guestware.com/dstGST.xsd">',
  ];
  var responseFooter = [
              '</dstGST>',
            '</diffgr:diffgram>',
          '</'+methodName+'Result>',
        '</'+methodName+'Response>',
      '</soap:Body>',
    '</soap:Envelope>'
  ];

  var responseBody = [];
  var typeCounters = {};
  data.forEach(function (dataObject, i) {
    if (typeof typeCounters[dataObject.$$elementType] === 'undefined')
      typeCounters[dataObject.$$elementType] = 1;
    else typeCounters[dataObject.$$elementType]++;
    var elementBody = this.generateUpdateElementBody(typeCounters[dataObject.$$elementType], dataObject);
    Array.prototype.push.apply(responseBody, elementBody.oldObject);
  }.bind(this));

  Array.prototype.push.apply(output, responseHeader);
  Array.prototype.push.apply(output, responseBody);
  Array.prototype.push.apply(output, responseFooter);

  return ({
    raw: output.join(''),
    parsed: this.domParser.parseFromString(output.join(''))
  });
}

module.exports = GuestwareSoapClient;