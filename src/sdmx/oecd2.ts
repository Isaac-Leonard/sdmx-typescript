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
import * as time from './time';
export class OECD implements interfaces.Queryable, interfaces.RemoteRegistry {
    private agency: string = "OECD";
    //http://stats.oecd.org/restsdmx/sdmx.ashx/GetDataStructure/ALL/OECD
    private serviceURL: string = "http://stats.oecd.org/restsdmx/sdmx.ashx/";
    //private serviceURL: string = "http://stat.abs.gov.au/restsdmx/sdmx.ashx/";
    private options: string = "";
    private local: interfaces.LocalRegistry = new registry.LocalRegistry();

    private dataflowList: Array<structure.Dataflow> = null;
    getDataService():string { return "OECD";}
    getRemoteRegistry(): interfaces.RemoteRegistry {
        return this;
    }

    getRepository(): interfaces.Repository {
        return this;//this;
        
    }

    clear() {
        this.local.clear();
    }
    query(q:data.Query) {
        var url = this.serviceURL + "GetData/" + q.getDataflow().getId().toString() + "/" + q.getQueryString() + "/all?startTime=" + q.getStartDate().getFullYear() + "&endTime=" + q.getEndDate().getFullYear()+"&format=compact_v2";
        return this.retrieveData(q.getDataflow(),url);
//http://stats.oecd.org/restsdmx/sdmx.ashx/GetData/QNA/AUS+AUT.GDP+B1_GE.CUR+VOBARSA.Q/all?startTime=2009-Q2&endTime=2011-Q4&format=compact_v2
    }
    constructor(agency: string, service: string, options: string) {
        if (service != null) { this.serviceURL = service; }
        if (agency != null) { this.agency = agency; }
        if (options != null) { this.options = options; }
    }

    load(struct: message.StructureType) {
        console.log("oecd load");
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
        console.log("oecd retrieve:" + urlString);
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
            return sdmx.SdmxIO.parseStructure(a);
        });
    }
    public retrieveData(dataflow: structure.Dataflow,urlString: string): Promise<message.DataMessage> {
        console.log("oecd retrieveData:" + urlString);
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
    public retrieve2(urlString: string): Promise<string> {
        console.log("oecd retrieve:" + urlString);
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
            var promise = new Promise<structure.DataStructure>(function(resolve, reject) {
                resolve(dst);
            }.bind(this));
            return promise;
        } else {
            return <Promise<structure.DataStructure>>this.retrieve(this.serviceURL + "GetDataStructure/" + ref.getMaintainableParentId() + "/" + this.agency).then(function(st: message.StructureType) {
                this.load(st);
                return st.findDataStructure(ref);
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
    public getServiceURL(): string { return this.serviceURL; }

    findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow> {
        if (this.dataflowList == null) {
            this.listDataflows().then(function(dataflows) {
                for (var i: number = 0; i < dataflows.length; i++) {
                    if (dataflows[i].identifiesMe(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getVersion())) {
                        return dataflows[i];
                    }
                }
            });
        }
        var p: Promise<structure.Dataflow> = new Promise<structure.Dataflow>(function(resolve, reject) {
            for (var i: number = 0; i < this.dataflowList.length; i++) {
                if (this.dataflowList[i].identifiesMe(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getVersion())) {
                    resolve(this.dataflowList[i]);
                }
            }
            reject(null);
        });
        return p;
    }
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
}
