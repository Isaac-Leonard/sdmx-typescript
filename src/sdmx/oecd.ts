/*
    This file is part of sdmx-js.

    sdmx-js is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    sdmx-js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with sdmx-js.  If not, see <http://www.gnu.org/licenses/>.
    Copyright (C) 2016 James Gardner
*/
//import { Promise } from 'bluebird';

import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as data from '../sdmx/data';
import * as parser from "../sdmx/parser";
import moment from "moment";
export class OECD implements interfaces.Queryable, interfaces.RemoteRegistry {
    private agency: string = "OECD";
    private serviceURL: string = "http://stats.oecd.org/Sdmxws/sdmx.asmx";
    private options: string = "http://stats.oecd.org/OECDStatWS/SDMX/";
    private local: interfaces.LocalRegistry = new registry.LocalRegistry();
    private mediaType: string = "text/xml; charset=utf-8"
    private dataflowList: Array<structure.Dataflow> = null;
    getDataService():string { return "OECD";}
    getRemoteRegistry(): interfaces.RemoteRegistry {
        return this;
    }

    getRepository(): interfaces.Repository {
        return this;
    }

    clear() {
        this.local.clear();
    }
    query(q: data.Query): Promise<message.DataMessage> {
        var url:string = this.serviceURL;
        var send:string = this.toGetDataQuery(q, this.options);
        return this.retrieveData(q.getDataflow(), this.serviceURL, send, {headers: {"Content-Type": this.mediaType}});
    }
    public retrieveData(dataflow: structure.Dataflow, urlString: string, send, opts): Promise<message.DataMessage> {
        console.log("abs retrieveData:" + urlString);
        opts.url = urlString;
        opts.method = "POST";
        return this.makeRequest(opts, send).then(function (a) {
            var dm = parser.SdmxParser.parseData(a);
            var payload = new common.PayloadStructureType();
            payload.setStructure(dataflow.getStructure());
            dm.getHeader().setStructures([payload]);
            return dm;
        });
    }
    constructor(agency: string, service: string, options: string) {
        if (service != null) {this.serviceURL = service;}
        if (agency != null) {this.agency = agency;}
        if (options != null) {this.options = options;}
    }

    load(struct: message.StructureType) {
        console.log("abs load");
        this.local.load(struct);
    }

    unload(struct: message.StructureType) {
        this.local.unload(struct);
    }
    makeRequest(opts, send: string): Promise<string> {
        return new Promise<string>(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(opts.method, opts.url);
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };
            if (opts.headers) {
                Object.keys(opts.headers).forEach(function (key) {
                    xhr.setRequestHeader(key, opts.headers[key]);
                });
            }
            var params = opts.params;
            // We'll need to stringify if we've been given an object
            // If we have a string, this is skipped.
            if (params && typeof params === 'object') {
                params = Object.keys(params).map(function (key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&');
            }
            xhr.send(send);
        });
    }
    public retrieve(urlString: string, send: string, opts): Promise<message.StructureType> {
        console.log("nomis retrieve:" + urlString);
        var s: string = this.options;
        opts.url = urlString;
        opts.method = "POST";
        return this.makeRequest(opts, send).then(function (a) {
            return parser.SdmxParser.parseStructure(a);
        });
    }
    public retrieve2(urlString: string): Promise<string> {
        console.log("nomis retrieve:" + urlString);
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + s + "&random=" + new Date().getTime();
        } else {
            s = "&" + s + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString;
        opts.method = "GET";
        opts.headers = {"Origin": document.location};
        return this.makeRequest(opts,"").then(function (a) {
            return a;
        });
    }

    public findDataStructure(ref: commonreferences.Reference): Promise<structure.DataStructure> {
        var dst: structure.DataStructure = this.local.findDataStructure(ref);
        if (dst != null) {
            var promise = new Promise<structure.DataStructure>(function (resolve, reject) {
                resolve(dst);
            }.bind(this));
            return promise;
        } else {
            return <Promise<structure.DataStructure>> this.retrieve(this.serviceURL, this.toGetDataStructureQuery(ref.getMaintainableParentId().toString(), ref.getAgencyId().toString(), this.options), {headers: {"Content-Type": this.mediaType, "SOAPAction": "http://stats.oecd.org/OECDStatWS/SDMX/GetDataStructureDefinition"}}).then(function (structure) {
                console.log("Struct");
                console.log(structure);
                this.local.load(structure);

                return structure.getStructures().findDataStructure(ref);
            }.bind(this));
        }
    }


    public listDataflows(): Promise<Array<structure.Dataflow>> {
        if (this.dataflowList != null) {
            var promise = new Promise<Array<structure.Dataflow>>(function (resolve, reject) {
                resolve(this.dataflowList);
            }.bind(this));
            return promise;
        } else {
            return <Promise<Array<structure.Dataflow>>> this.retrieve(this.serviceURL, this.toGetDataStructureListQuery11(this.agency, this.options), {headers: {"Content-Type": this.mediaType, "SOAPAction": "http://stats.oecd.org/OECDStatWS/SDMX/GetDataStructureDefinition"}}).then(function (st) {
                var array: Array<structure.DataStructure> = st.getStructures().getDataStructures().getDataStructures();
                var dfs: Array<structure.Dataflow> = [];
                for (var i = 0; i < array.length; i++) {
                    dfs.push(array[i].asDataflow());
                }
                this.dataflowList = dfs;
                return dfs;
            }.bind(this)
            );
        }
    }
    public getServiceURL(): string {return this.serviceURL;}
    findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow> {return null;}
    findCode(ref: commonreferences.Reference): Promise<structure.CodeType> {return null;}
    findCodelist(ref: commonreferences.Reference): Promise<structure.Codelist> {return null;}
    findItemType(item: commonreferences.Reference): Promise<structure.ItemType> {return null;}
    findConcept(ref: commonreferences.Reference): Promise<structure.ConceptType> {return null;}
    findConceptScheme(ref: commonreferences.Reference): Promise<structure.ConceptSchemeType> {return null;}
    searchDataStructure(ref: commonreferences.Reference): Promise<Array<structure.DataStructure>> {return null;}
    searchDataflow(ref: commonreferences.Reference): Promise<Array<structure.Dataflow>> {return null;}
    searchCodelist(ref: commonreferences.Reference): Promise<Array<structure.Codelist>> {return null;}
    searchItemType(item: commonreferences.Reference): Promise<Array<structure.ItemType>> {return null;}
    searchConcept(ref: commonreferences.Reference): Promise<Array<structure.ConceptType>> {return null;}
    searchConceptScheme(ref: commonreferences.Reference): Promise<Array<structure.ConceptSchemeType>> {return null;}
    getLocalRegistry(): interfaces.LocalRegistry {
        return this.local;
    }
    save(): any {}
    public toGetDataStructureListQuery11(providerRef: string, soapNamespace: string): string {
        var s: string = "";
        s += "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:sdmx=\"" + soapNamespace + "\">";
        s += "<soapenv:Header></soapenv:Header>";
        s += "<soapenv:Body>";
        s += "<sdmx:GetDataStructureDefinition>";
        s += "<sdmx:QueryMessage>";
        s += "<message:QueryMessage xmlns:message=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><Header xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><message:ID>none</message:ID><message:Test>false</message:Test><message:Prepared>2016-08-19T00:04:18+08:00</message:Prepared><message:Sender id=\"Sdmx-Sax\" /><message:Receiver id=\"" + providerRef + "\" /></Header><message:Query><query:KeyFamilyWhere xmlns:query=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/query\"><query:And /></query:KeyFamilyWhere></message:Query></message:QueryMessage>";
        s += "</sdmx:QueryMessage>";
        s += "</sdmx:GetDataStructureDefinition>";
        s += "</soapenv:Body>";
        s += "</soapenv:Envelope>";
        return s;
    }

    public toGetDataStructureQuery(keyFamily: string, providerRef: string, soapNamespace: string): string {
        var s: string = "";
        s += "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:sdmx=\"" + soapNamespace + "\">";
        s += "<soapenv:Header/>";
        s += "<soapenv:Body>";
        s += "<sdmx:GetDataStructureDefinition>";
        s += "<!--Optional:-->";
        s += "<sdmx:QueryMessage>";
        s += "<message:QueryMessage xsi:schemaLocation=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/queryhttp://www.sdmx.org/docs/2_0/SDMXQuery.xsd http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message http://www.sdmx.org/docs/2_0/SDMXMessage.xsd\" xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/query\" xmlns:message=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">";
        s += "<Header xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\">";
        s += "<ID>none</ID>";
        s += "<Test>false</Test>";
        s += "<Prepared>2012-06-01T09:33:53</Prepared>";
        s += "<Sender id=\"YourID\">";
        s += "<Name xml:lang=\"en\">Your English Name</Name>";
        s += "</Sender>";
        s += "<Receiver id=\"" + providerRef + "\">";
        s += "<Name xml:lang=\"en\">Australian Bureau of Statistics</Name>";
        s += "<Name xml:lang=\"fr\">Australian Bureau of Statistics</Name>";
        s += "</Receiver>";
        s += "</Header>";
        s += "<message:Query>";
        s += "<KeyFamilyWhere>";
        s += "<Or>";
        s += "<KeyFamily>" + keyFamily + "</KeyFamily>";
        s += "</Or>";
        s += "</KeyFamilyWhere>";
        s += "</message:Query>";
        s += "</message:QueryMessage>";
        s += "</sdmx:QueryMessage>";
        s += "</sdmx:GetDataStructureDefinition>";
        s += "</soapenv:Body>";
        s += "</soapenv:Envelope>";
        return s;
    }

    public toGetDataQuery(q: data.Query, soapNamespace: string): string {
        var s: string = "";
        var startTime = moment(q.getStartDate());
        var endTime = moment(q.getEndDate());
        s += "<soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">";
        s += "<soap12:Body>";
        s += "<GetCompactData xmlns=\"http://stats.oecd.org/OECDStatWS/SDMX/\">";
        s += "<QueryMessage>";
        s += "<message:QueryMessage xmlns:message=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\">";
        s += "<Header xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\">";
        s += "<message:ID>none</message:ID>";
        s += "<message:Test>false</message:Test>";
        s += "<message:Prepared>2016-08-19T00:11:33+08:00</message:Prepared>";
        s += "<message:Sender id=\"Sdmx-Sax\"/>";
        s += "<message:Receiver id=\"" + this.agency + "\"/>";
        s += "</Header>";
        s += "<message:Query>";
        s += "<DataWhere xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/query\">";
        s += "<And>";
        s += "<DataSet>" + q.getDataflow().getId().toString() + "</DataSet>";
        s += "<Time>";
        s += "<StartTime>" + startTime.format("YYYY-MM-DD") + "</StartTime>";
        s += "<EndTime>" + endTime.format("YYYY-MM-DD") + "</EndTime>";
        s += "</Time>";

        for (var i: number = 0; i < q.size(); i++) {
            if (q.getQueryKey(q.getKeyNames()[i]).size() > 0) {
                s += "<Or>";
                for (var j: number = 0; j < q.getQueryKey(q.getKeyNames()[i]).size(); j++) {
                    s += "<Dimension id=\"" + q.getQueryKey(q.getKeyNames()[i]).getName() + "\">" + q.getQueryKey(q.getKeyNames()[i]).get(j) + "</Dimension>";
                }
                s += "</Or>";
            }
        }
        s += "</And>";
        s += "</DataWhere>";
        s += "</message:Query>";
        s += "</message:QueryMessage>";
        s += "</QueryMessage>";
        s += "</GetCompactData>";
        s += "</soap12:Body>";
        s += "</soap12:Envelope>";
        return s;
    }
}
export default { OECD:OECD }