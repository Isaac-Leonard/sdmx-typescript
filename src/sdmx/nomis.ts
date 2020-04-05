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
import moment from "moment";
//import { Promise } from 'bluebird';

import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as data from '../sdmx/data';
import * as parser from '../sdmx/parser';
import * as time from './time';
export function parseXml(s: string): any {
    var parseXml: DOMParser;
    parseXml = new DOMParser();
    var xmlDoc = parseXml.parseFromString(s, "text/xml");
    return xmlDoc;
}
export class NOMISRESTServiceRegistry implements interfaces.RemoteRegistry, interfaces.Queryable {

    private agency: string = "NOMIS";
    private serviceURL: string = "http://www.nomisweb.co.uk/api";
    private options: string = "uid=0xad235cca367972d98bd642ef04ea259da5de264f";
    private local: interfaces.LocalRegistry = new registry.LocalRegistry();

    private dataflowList: Array<structure.Dataflow> = null;

    public throttle(fn, threshhold, scope) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;
        return function() {
            var context = scope || this;

            var now = +new Date,
                args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function() {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }
    getDataService():string { return "NOMIS";}
    getRemoteRegistry(): interfaces.RemoteRegistry {
        return this;
    }

    getRepository(): interfaces.Repository {
        return null;

    }

    clear() {
        this.local.clear();
    }
    query(q: data.Query): Promise<message.DataMessage> {
        var flow: structure.Dataflow = q.getDataflow();
        var startTime = q.getStartDate();
        var endTime = q.getEndDate();
        var geogIndex: number = flow.getId().toString().lastIndexOf("_");
        var geog: string = flow.getId().toString().substring(geogIndex + 1, flow.getId().toString().length);
        var geography_string: string = "&geography=" + geog;
        if ("NOGEOG" == geog) {
            geography_string = "";
        }
        var id: string = flow.getId().toString().substring(0, geogIndex);
        var dst_ref: commonreferences.Ref = new commonreferences.Ref();
        dst_ref.setAgencyId(flow.getAgencyId());
        dst_ref.setId(new commonreferences.ID(id));
        dst_ref.setVersion(flow.getVersion());
        var dst_reference = new commonreferences.Reference(dst_ref, null);
        var st: Promise<message.StructureType> = this.retrieve(this.getServiceURL() + "/v01/dataset/" + id + "/time/def.sdmx.xml");
        return <Promise<message.DataMessage>>st.then(function(struc: message.StructureType) {
            var times: string = "&TIME=";
            var timeCL: structure.Codelist = struc.getStructures().getCodeLists().getCodelists()[0];
            var comma: boolean = true;
            for (var i: number = 0; i < timeCL.size(); i++) {
                var rtp: time.RegularTimePeriod = time.TimeUtil.parseTime("", timeCL.getItems()[i].getId().toString());
                var ts = moment(rtp.getStart());
                var te = moment(rtp.getEnd());
                var startMoment = moment(startTime);
                var endMoment = moment(endTime);
                if (ts.isBetween(startMoment, endMoment)) {
                    //console.log(timeCL.getItems()[i].getId().toString() + " is between " + startTime + " and " + endTime);
                    if (!comma) {
                        times += ",";
                        comma = true;
                    }
                    times += timeCL.getItem(i).getId().toString();
                    comma = false;
                } else {
                    console.log(timeCL.getItems()[i].getId().toString() + " is not between " + startTime + " and " + endTime);
                }
            }
            var queryString: string = "";
            var kns = q.getKeyNames();
            for (var i: number = 0; i < kns.length; i++) {
                var name: string = kns[i];
                if (i == 0) {
                    queryString += "?";
                } else {
                    queryString += "&";
                }
                queryString += name + "=";
                for (var j: number = 0; j < q.getQueryKey(kns[i]).size(); j++) {
                    queryString += q.getQueryKey(kns[i]).get(j);
                    if (j < q.getQueryKey(kns[i]).size() - 1) {
                        queryString += ",";
                    }
                }
            }
            return this.retrieveData(flow, "http://www.nomisweb.co.uk/api/v01/dataset/" + dst_ref.getId() + ".compact.sdmx.xml" + queryString + times + "&" + this.options);
        }.bind(this));
        /*
        StringBuilder q = new StringBuilder();
        for (int i = 0; i < structure.getDataStructureComponents().getDimensionList().size(); i++) {
            DimensionType dim = structure.getDataStructureComponents().getDimensionList().getDimension(i);
            boolean addedParam = false;
            String concept = dim.getConceptIdentity().getId().toString();
            List<String> params = message.getQuery().getDataWhere().getAnd().get(0).getDimensionParameters(concept);
            System.out.println("Params=" + params);
            if (params.size() > 0) {
                addedParam = true;
                q.append(concept + "=");
                for (int j = 0; j < params.size(); j++) {
                    q.append(params.get(j));
                    if (j < params.size() - 1) {
                        q.append(",");
                    }
                }
            }
            if (addedParam && i < structure.getDataStructureComponents().getDimensionList().size() - 1) {
                q.append("&");
            }
            addedParam = false;
        }
        DataMessage msg = null;
        msg = query(pparams, getServiceURL() + "/v01/dataset/" + id + ".compact.sdmx.xml?" + q + "&time=" + times.toString() + geography_string +"&" + options);
        */
        //return null;
    }
    constructor(agency: string, service: string, options: string) {
        if (service != null) {
            this.serviceURL = service;
        } else {

        }
        if (agency != null) {
            this.agency = agency;
        }
        if (options != null) {
            this.options = options;
        }
    }

    load(struct: message.StructureType) {
        console.log("nomis load");
        this.local.load(struct);
    }

    unload(struct: message.StructureType) {
        this.local.unload(struct);
    }
    makeRequest(opts): Promise<string> {
        return new Promise<string>(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            console.log("nomis retrieve:" + opts.url);
            xhr.open(opts.method, opts.url);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.responseText);
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
    
    /*
     * Modified to always resolve
     * 
     */
    makeRequest2(opts): Promise<string> {
        return new Promise<string>(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            console.log("nomis retrieve:" + opts.url);
            xhr.open(opts.method, opts.url);
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.responseText);
                } else {
                    resolve("");
                }
            };
            xhr.onerror = function() {
                resolve("");
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
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + this.options + "&random=" + new Date().getTime();
        } else {
            s = "&" + this.options + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString + s;
        opts.method = "GET";
        opts.headers = { "Connection": "close" ,
         "Origin": document.location};
        return this.makeRequest(opts).then(function(a) {
            return parser.SdmxParser.parseStructure(a);
        });
    }
    public retrieveData(dataflow: structure.Dataflow, urlString: string): Promise<message.DataMessage> {
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + s + "&random=" + new Date().getTime();
        } else {
            s = "&" + s + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString + s;
        opts.method = "GET";
        opts.headers = { "Connection": "close","Origin": document.location};
        return this.makeRequest(opts).then(function(a) {
            var dm = parser.SdmxParser.parseData(a);
            var payload = new common.PayloadStructureType();
            payload.setStructure(dataflow.getStructure());
            dm.getHeader().setStructures([payload]);
            return dm;
        });
    }
    public retrieve2(urlString: string, vals: any): Promise<any> {
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
        opts.headers = { "Connection": "close" };
        return this.makeRequest2(opts).then(function(a) {
            var pack = { string: a };
            for (var i: number = 0; i < Object.keys(vals).length; i++) {
                var k = Object.keys(vals)[i];
                pack[k] = vals[k];
            }
            return pack;
        });
    }
    /*
      This function ignores the version argument!!!
      ILO stat does not use version numbers.. simply take the latest
     */

    public findDataStructure(ref: commonreferences.Reference): Promise<structure.DataStructure> {
        var dst: structure.DataStructure = this.local.findDataStructure(ref);
        if (dst != null) {
            var promise1 = new Promise<structure.DataStructure>(function(resolve, reject) {
                resolve(dst);
            }.bind(this));
            return promise1;
        } else {
            var geogIndex = ref.getMaintainableParentId().toString().lastIndexOf("_");
            var geog: string = ref.getMaintainableParentId().toString().substring(geogIndex + 1, ref.getMaintainableParentId().toString().length);
            var geography_string: string = "geography=" + geog;
            if ("NOGEOG" == geog) {
                geography_string = "";
            }
            var id: string = ref.getMaintainableParentId().toString().substring(0, geogIndex);
            return <Promise<structure.DataStructure>>this.retrieve(this.getServiceURL() + "/v01/dataset/" + id + ".structure.sdmx.xml?" + geography_string).then(function(a) {
                a.getStructures().getDataStructures().getDataStructures()[0].setId(ref.getMaintainableParentId());
                a.getStructures().getDataStructures().getDataStructures()[0].setVersion(ref.getVersion());
                this.load(a);
                return this.local.findDataStructure(ref);
            }.bind(this));
        }
    }
    public listDataflows(): Promise<Array<structure.Dataflow>> {
        if (this.dataflowList != null) {
            var promise1 = new Promise<Array<structure.Dataflow>>(function(resolve, reject) {
                resolve(this.dataflowList);
            }.bind(this));
            return promise1;
        } else {
            var dfs: Array<structure.Dataflow> = [];
            var th = this;
            var promise2: any = this.retrieve(this.serviceURL + "/v01/dataset/def.sdmx.xml").then(function(st: message.StructureType) {
                var packArray = [];
                var list: Array<structure.DataStructure> = st.getStructures().getDataStructures().getDataStructures();
                for (var i: number = 0; i < list.length; i++) {
                    var dst: structure.DataStructure = list[i];
                    var cubeId: string = structure.NameableType.toIDString(dst);
                    var cubeName: string = dst.findName("en").getText();
                    var url: string = th.serviceURL + "/v01/dataset/" + cubeId + ".overview.xml";
                    var pack = { cubeId: cubeId, cubeName: cubeName, url: url };
                    packArray.push(pack);
                }
                return packArray;
            });
            return promise2.map(function(item, index, length) {
                var pack = item;
                return th.retrieve2(pack.url, pack).then(function(pack) {
                    var cubeId2: string = pack.cubeId;
                    var cubeName2: string = pack.cubeName;
                    var url2: string = pack.url;
                    var doc: string = pack.string;
                    var parsedDataflows = [];
                    try {
                        var geogList: Array<NOMISGeography> = th.parseGeography(doc, cubeId2, cubeName2);
                        for (var j = 0; j < geogList.length; j++) {
                            var dataFlow: structure.Dataflow = new structure.Dataflow();
                            dataFlow.setAgencyId(new commonreferences.NestedNCNameID((th.agency)));
                            dataFlow.setId(new commonreferences.ID(cubeId2 + "_" + geogList[j].getGeography()));
                            var name: common.Name = new common.Name("en", cubeName2 + " " + geogList[j].getGeographyName());
                            var names: Array<common.Name> = [];
                            names.push(name);
                            dataFlow.setNames(names);
                            var ref: commonreferences.Ref = new commonreferences.Ref();
                            ref.setAgencyId(new commonreferences.NestedNCNameID(th.agency));
                            ref.setMaintainableParentId(dataFlow.getId());
                            ref.setVersion(commonreferences.Version.ONE);
                            var reference = new commonreferences.Reference(ref, null);
                            dataFlow.setStructure(reference);
                            parsedDataflows.push(dataFlow);
                        }
                        if (geogList.length == 0) {
                            var dataFlow: structure.Dataflow = new structure.Dataflow();
                            dataFlow.setAgencyId(new commonreferences.NestedNCNameID((th.agency)));
                            dataFlow.setId(new commonreferences.ID(cubeId2 + "_NOGEOG"));
                            var name: common.Name = new common.Name("en", cubeName2);
                            var names: Array<common.Name> = [];
                            names.push(name);
                            dataFlow.setNames(names);
                            var ref: commonreferences.Ref = new commonreferences.Ref();
                            ref.setAgencyId(new commonreferences.NestedNCNameID(th.agency));
                            ref.setMaintainableParentId(dataFlow.getId());
                            ref.setVersion(commonreferences.Version.ONE);
                            var reference = new commonreferences.Reference(ref, null);
                            dataFlow.setStructure(reference);
                            parsedDataflows.push(dataFlow);
                        }
                    } catch (error) {
                        console.log("error!:" + error);
                    }
                    return parsedDataflows;
                });
            }, { concurrency: 5 }).delay(1300).then(function(stuff) {
                // works with delay of 1000, put 1300 to be safe =D
                var dfs = [];
                for (var i: number = 0; i < stuff.length; i++) {
                    for (var j: number = 0; j < stuff[i].length; j++) {
                        dfs.push(stuff[i][j]);
                    }
                }
                this.dataflowList = dfs;
                return dfs;
            }.bind(this));
        }
    }

    public getServiceURL(): string {
        return this.serviceURL;
    }
    public parseGeography(doc: string, cubeId: string, cubeName: string): Array<NOMISGeography> {
        var geogList: Array<NOMISGeography> = [];
        var tagContent: string = null;
        var lastLang: string = null;
        var xmlDoc = parseXml(doc);
        var dimNode = this.findNodeName("Dimensions", xmlDoc.documentElement.childNodes);
        if (dimNode == null) {
            return geogList;
        }
        var dimsNode = this.searchNodeName("Dimension", dimNode.childNodes);
        if (dimsNode == null || dimsNode.length == 0) {
            return geogList;
        }
        var geogNode = null;
        for (var i = 0; i < dimsNode.length; i++) {
            if (dimsNode[i].getAttribute("concept") == "geography") {
                geogNode = dimsNode[i];
            }
        }
        if (geogNode == null) return geogList;
        var typesNode = this.findNodeName("Types", geogNode.childNodes);
        if (typesNode == null) return geogList;
        var typeArray = this.searchNodeName("Type", typesNode.childNodes);
        if (typeArray.length == 0) {
            return geogList;
        }
        for (var i: number = 0; i < typeArray.length; i++) {
            var ng: NOMISGeography = new NOMISGeography(typeArray[i].getAttribute("value"), typeArray[i].getAttribute("name"), cubeName, cubeId);
            geogList.push(ng);
        }
        return geogList;
    }
    recurseDomChildren(start: any, output: any) {
        var nodes;
        if (start.childNodes) {
            nodes = start.childNodes;
            this.loopNodeChildren(nodes, output);
        }
    }

    loopNodeChildren(nodes: Array<any>, output: any) {
        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (output) {
                this.outputNode(node);
            }
            if (node.childNodes) {
                this.recurseDomChildren(node, output);
            }
        }
    }
    outputNode(node: any) {
        var whitespace = /^\s+$/g;
        if (node.nodeType === 1) {
            console.log("element: " + node.tagName);
        } else if (node.nodeType === 3) {
            //clear whitespace text nodes
            node.data = node.data.replace(whitespace, "");
            if (node.data) {
                console.log("text: " + node.data);
            }
        }
    }
    findNodeName(s: string, childNodes: any) {
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) == 0) {
                //alert("found node:"+s);
                return childNodes[i];
            }
        }
        return null;
    }
    searchNodeName(s: string, childNodes: any): Array<any> {
        var result: Array<any> = [];
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) == 0) {
                //alert("found node:"+s);
                result.push(childNodes[i]);
            }
        }
        if (result.length == 0) {
            //alert("cannot find any " + s + " in node");
        }
        return result;
    }
    findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow> {
        return null;
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
export class NOMISGeography {
    private geography: string = "";
    private geographyName: string = "";
    private cubeName: string = "";
    private cubeId: string = "";
    constructor(geography: string, geographyName: string, cubeName: string, cubeId: string) {
        this.geography = geography;
        this.geographyName = geographyName;
        this.cubeName = cubeName;
        this.cubeId = cubeId;

    }
    getGeography() {
        return this.geography;
    }
    getCubeName() { return this.cubeName; }
    getCubeId() {
        return this.cubeId;
    }
    getGeographyName() {
        return this.geographyName;
    }

}
export default {NOMISRestServiceRegistry: NOMISRESTServiceRegistry }