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
import {Promise} from 'bluebird';
import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as data from '../sdmx/data';
import * as sdmx from '../sdmx';
import moment from "moment";
export class ABS2 implements interfaces.Queryable, interfaces.RemoteRegistry {
    private agency: string = "ABS";
    private serviceURL: string = "http://stat.data.abs.gov.au/sdmxws/sdmx.asmx";
    private options: string = "http://stats.oecd.org/OECDStatWS/SDMX/";
    private local: interfaces.LocalRegistry = new registry.LocalRegistry();

    private dataflowList: Array<structure.Dataflow> = null;
    
    
    private displayFormat:any = moment("dd-mm-yyyy");
    getDataService():string { return "ABS";}
    getRemoteRegistry(): interfaces.RemoteRegistry {
        return this;
    }

    getRepository(): interfaces.Repository {
        return this;
    }

    clear() {
        this.local.clear();
    }
    query(q:data.Query):Promise<message.DataMessage> {
        var url = '';
        if (this.getLocalRegistry().findDataStructure(q.getDataflow().getStructure()).getDataStructureComponents().getDimensionList().getTimeDimension()!=null){
           url = this.serviceURL + "GetData/" + q.getDataflow().getId().toString() + "/" + q.getQueryString() + "/all?startTime=" + q.getStartDate().getFullYear() + "&endTime=" + q.getEndDate().getFullYear()+"&format=compact_v2";
        }else{
        // No Time Dimension
           url = this.serviceURL + "GetData/" + q.getDataflow().getId().toString() + "/" + q.getQueryString() + "/all?&format=compact_v2";
        }
        return this.retrieveData(q.getDataflow(),url);
    }
    public retrieveData(dataflow: structure.Dataflow,urlString: string): Promise<message.DataMessage> {
        console.log("abs retrieveData:" + urlString);
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + s + "&random=" + new Date().getTime();
        } else {
            s = "&" + s + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString;
        opts.method = "GET";
        opts.headers = { "Origin": document.location};
        return this.makeRequest(opts).then(function(a) {
            console.log("Got Data Response");
            var dm = sdmx.SdmxIO.parseData(a);
            var payload = new common.PayloadStructureType();
            payload.setStructure(dataflow.getStructure());
            dm.getHeader().setStructures([payload]);
            return dm;
        });
    }
    constructor(agency: string, service: string, options: string) {
        if (service != null) { this.serviceURL = service; }
        if (agency != null) { this.agency = agency; }
        if (options != null) { this.options = options; }
    }

    load(struct: message.StructureType) {
        console.log("abs load");
        this.local.load(struct);
    }

    unload(struct: message.StructureType) {
        this.local.unload(struct);
    }
    makeRequest(opts): Promise<string> {
        return new Promise<string>(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(opts.method, opts.url);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function() {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            };
            if (opts.headers) {
                Object.keys(opts.headers).forEach(function(key) {
                    xhr.setRequestHeader(key, opts.headers[key]);
                });
            }
            var params = opts.params;
            // We'll need to stringify if we've been given an object
            // If we have a string, this is skipped.
            if (params && typeof params === 'object') {
                params = Object.keys(params).map(function(key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&');
            }
            xhr.send(params);
        });
    }
    public retrieve(urlString: string): Promise<message.StructureType> {
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
        opts.headers = {};
        return this.makeRequest(opts).then(function(a) {
            return sdmx.SdmxIO.parseStructure(a);
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
        opts.headers = { "Origin": document.location};
        return this.makeRequest(opts).then(function(a) {
            return a;
        });
    }

    public findDataStructure(ref: commonreferences.Reference): Promise<structure.DataStructure> {
        var dst: structure.DataStructure = this.local.findDataStructure(ref);
        if (dst != null) {
            var promise = new Promise < structure.DataStructure>(function(resolve, reject) {
                resolve(dst);
            }.bind(this));
            return promise;
        } else {
            return <Promise<structure.DataStructure>>this.retrieve(this.getServiceURL() + "GetDataStructure/" + ref.getMaintainableParentId().toString() + "/" + ref.getAgencyId().toString()).then(function(structure: message.StructureType){
                this.local.load(structure);
                return structure.getStructures().findDataStructure(ref);
            }.bind(this));
        }
    }


    public listDataflows(): Promise<Array<structure.Dataflow>> {
        if (this.dataflowList != null) {
            var promise = new Promise<Array<structure.Dataflow>>(function(resolve, reject) {
                resolve(this.dataflowList);
            }.bind(this));
            return promise;
        } else {
            return <Promise<Array<structure.Dataflow>>>this.retrieve(this.serviceURL + "GetDataStructure/ALL/" + this.agency).then(function(st: message.StructureType) {
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
    public getServiceURL(): string { return this.serviceURL;    }
    findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow> { return null; }
    findCode(ref: commonreferences.Reference): Promise<structure.CodeType> { return null; }
    findCodelist(ref: commonreferences.Reference): Promise<structure.Codelist> { return null; }
    findItemType(item: commonreferences.Reference): Promise<structure.ItemType> { return null; }
    findConcept(ref: commonreferences.Reference): Promise<structure.ConceptType> { return null; }
    findConceptScheme(ref: commonreferences.Reference): Promise<structure.ConceptSchemeType> { return null; }
    searchDataStructure(ref: commonreferences.Reference): Promise<Array<structure.DataStructure>> { return null; }
    searchDataflow(ref: commonreferences.Reference): Promise<Array<structure.Dataflow>> { return null; }
    searchCodelist(ref: commonreferences.Reference): Promise<Array<structure.Codelist>> { return null; }
    searchItemType(item: commonreferences.Reference): Promise<Array<structure.ItemType>> { return null; }
    searchConcept(ref: commonreferences.Reference): Promise<Array<structure.ConceptType>> { return null; }
    searchConceptScheme(ref: commonreferences.Reference): Promise<Array<structure.ConceptSchemeType>> { return null; }
    getLocalRegistry(): interfaces.LocalRegistry {
        return this.local;
    }
    save(): any { }
    public static toGetDataStructureListQuery11(providerRef:string,soapNamespace:string):string {
        var s:string = "";
        s+="<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:sdmx=\"http://stats.oecd.org/OECDStatWS/SDMX/\">";
        s+="<soapenv:Header></soapenv:Header>";
        s+="<soapenv:Body>";
        s+="<sdmx:GetDataStructureDefinition>";
        s+="<sdmx:QueryMessage>";
        s+="<message:QueryMessage xmlns:message=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><Header xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><message:ID>none</message:ID><message:Test>false</message:Test><message:Prepared>2016-08-19T00:04:18+08:00</message:Prepared><message:Sender id=\"Sdmx-Sax\" /><message:Receiver id=\"" + providerRef + "\" /></Header><message:Query><query:KeyFamilyWhere xmlns:query=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/query\"><query:And /></query:KeyFamilyWhere></message:Query></message:QueryMessage>";
        s+="</sdmx:QueryMessage>";
        s+="</sdmx:GetDataStructureDefinition>";
        s+="</soapenv:Body>";
        s+="</soapenv:Envelope>";
        return s;
    }

    public static toGetDataStructureQuery(keyFamily:string,providerRef:string,soapNamespace:string):string {
        var s:string = "";
        s+="<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\" xmlns:sdmx=\"http://stats.oecd.org/OECDStatWS/SDMX/\"><soap:Body><sdmx:GetDataStructureDefinition>"
                + "<sdmx:QueryMessage><message:QueryMessage xmlns:message=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><Header xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><message:ID>none</message:ID><message:Test>false</message:Test><message:Prepared>2016-08-19T00:08:29+08:00</message:Prepared><message:Sender id=\"Sdmx-Sax\" /><message:Receiver id=\"" + providerRef + "\" /></Header><message:Query><query:KeyFamilyWhere xmlns:query=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/query\"><query:And><query:KeyFamily>" + keyFamily + "</query:KeyFamily></query:And></query:KeyFamilyWhere></message:Query></message:QueryMessage>"
                + "</sdmx:QueryMessage></sdmx:GetDataStructureDefinition></soap:Body></soap:Envelope>";
        return s;
    }

    public static toGetDataQuery(q: data.Query,soapNamespace:string):string {
        var s:string = "";
        s+="<soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\">\n"
                + "  <soap12:Body>\n"
                + "    <GetCompactData xmlns=\"http://stats.oecd.org/OECDStatWS/SDMX/\">\n"
            + "      <QueryMessage><message:QueryMessage xmlns:message=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><Header xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message\"><message:ID>none</message:ID><message:Test>false</message:Test><message:Prepared>2016-08-19T00:11:33+08:00</message:Prepared><message:Sender id=\"Sdmx-Sax\" /><message:Receiver id=\"" + q.getProviderRef() + "\" /></Header><message:Query><DataWhere xmlns=\"http://www.SDMX.org/resources/SDMXML/schemas/v2_0/query\"><And><DataSet>" + q.getDataflow().getId().toString() + "</DataSet><Time><StartTime>" + moment(q.getStartDate()).format("dd-MM-yyyy") + "</StartTime><EndTime>" + moment(q.getEndDate()).format("dd-MM-yyyy") + "</EndTime></Time>";
        for (var i:number = 0; i < q.size(); i++) {
            if (q.getQueryKey(q.getKeyNames()[i]).size() > 0) {
                s+="<Or>";
                for (var j: number = 0; j < q.getQueryKey(q.getKeyNames()[i]).size(); j++) {
                    s += "<Dimension id=\"" + q.getQueryKey(q.getKeyNames()[i]).getName() + "\">" + q.getQueryKey(q.getKeyNames()[i]).get(j) + "</Dimension>";
                }
                s+="</Or>";
            }
        }
        s+="</And></DataWhere></message:Query></message:QueryMessage>\n";
        s+="</QueryMessage>\n";
        s+="</GetCompactData>\n";
        s+="</soap12:Body>\n";
        s+="</soap12:Envelope>";
        return s;
    }
}
