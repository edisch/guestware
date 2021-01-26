"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var SoapRequest_1 = require("../SoapRequest");
var ReadGuestRewardBalanceRequest = /** @class */ (function (_super) {
    __extends(ReadGuestRewardBalanceRequest, _super);
    function ReadGuestRewardBalanceRequest(guestID) {
        return _super.call(this, "\n      <soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:web=\"http://webservices.guestware.com/\">\n        <soapenv:Header>\n          <web:GWCNOBJ>\n            <web:UserName>{{UserName}}</web:UserName>\n            <web:PassWord>{{PassWord}}</web:PassWord>\n            <web:ApplicationName>{{AppName}}</web:ApplicationName>\n            <web:VersionNumber>{{Version}}</web:VersionNumber>\n          </web:GWCNOBJ>\n        </soapenv:Header>\n        <soapenv:Body>\n          <web:ReadGuestRewardBalance>\n            <web:parintGuestID>" + guestID + "</web:parintGuestID>\n          </web:ReadGuestRewardBalance>\n        </soapenv:Body>\n      </soapenv:Envelope>\n    ") || this;
    }
    return ReadGuestRewardBalanceRequest;
}(SoapRequest_1["default"]));
exports["default"] = ReadGuestRewardBalanceRequest;