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
import * as collections from 'typescript-collections';
import moment from "moment";
//import { Promise } from 'bluebird';

import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as data from '../sdmx/data';
import * as sdmx from '../sdmx';
import * as time from '../sdmx/time';
import * as xml from '../sdmx/xml';
import * as Language from "../sdmx/language";
export function parseXml(s: string): any {
    var parseXml: DOMParser;
    parseXml = new DOMParser();
    var xmlDoc = parseXml.parseFromString(s, "text/xml");
    
    
    
    
    
    return xmlDoc;
}

export class Sdmx20StructureParser implements interfaces.SdmxParserProvider {
    constructor() {

    }
    getVersionIdentifier(): number {
        return 2.0;
    }
    canParse(input: string): boolean {
        if (input == null) return false;
        if (this.isStructure(input)) return true;
        if (this.isData(input)) return true;
    }
    isStructure(input: string): boolean {
        if (input.indexOf("Structure") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
            return true;
        } else return false;
    }
    isData(input: string): boolean {
        if (input.indexOf("CompactData") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
            return true;
        }
        if (input.indexOf("GenericData") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
            return true;
        }
        if (input.indexOf("MessageGroup") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
            return true;
        }
        else return false;
    }
    isMetadata(header: string): boolean {
        return false;
    }
    parseStructureWithRegistry(input: string, reg: interfaces.LocalRegistry): message.StructureType {
        var srt: Sdmx20StructureReaderTools = new Sdmx20StructureReaderTools(input, reg);
        return srt.getStructureType();

    }
    parseStructure(input: string): message.StructureType {
        var srt: Sdmx20StructureReaderTools = new Sdmx20StructureReaderTools(input, null);
        return srt.getStructureType();

    }
    isCompactData(input: string) {
        if (input.indexOf("CompactData") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
            return true;
        }
        return false;
    }
    isGenericData(input: string) {
        if (input.indexOf("GenericData") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
            return true;
        }
        return false;
    }
    parseData(input: string): message.DataMessage {
        if (this.isGenericData(input)) {
            var parser: Sdmx20GenericDataReaderTools = new Sdmx20GenericDataReaderTools(input);
            return parser.getDataMessage();
        } else {
            var parser2: Sdmx20DataReaderTools = new Sdmx20DataReaderTools(input);
            return parser2.getDataMessage();
        }

    }
}
export class Sdmx20DataReaderTools {
    private msg: message.DataMessage = null;
    private dw: data.FlatDataSetWriter = new data.FlatDataSetWriter();

    constructor(s: string) {
        //console.log("sdmx20 parsing data");
        var dom: any = parseXml(s);
        //console.log("sdmx20 creating DataMessage");
        this.msg = this.toDataMessage(this.findCompactDataNode(dom.documentElement));
    }
    findCompactDataNode(node){
        if( node.nodeName.indexOf("CompactData")!=-1&&node.nodeName!="GetCompactDataResult"&&node.nodeName!="GetCompactDataResponse"){
            return node;
        }
        var st = null;
        for(var i:number=0;i<node.childNodes.length&&st==null;i++) {
            st = this.findCompactDataNode(node.childNodes[i]);
            if( st !=null ) {return st;}
        }
        return null;
    }
    getDataMessage(): message.DataMessage { return this.msg; }
    toDataMessage(dm: any): message.DataMessage {
        var msg: message.DataMessage = new message.DataMessage();
        var childNodes = dm.childNodes;
        msg.setHeader(this.toHeader(this.findNodeName("Header", childNodes)));
        var dss = this.toDataSets(this.searchNodeName("DataSet", childNodes));
        for (var i: number = 0; i < dss.length; i++) {
            msg.addDataSet(dss[i]);
        }
        return msg;
    }
    toDataSets(dm: Array<any>): Array<data.FlatDataSet> {
        var dss: Array<data.FlatDataSet> = [];
        for (var i: number = 0; i < dm.length; i++) {
            dss.push(this.toDataSet(dm[i].childNodes));
        }
        return dss;
    }
    toDataSet(ds: any): data.FlatDataSet {
        this.dw.newDataSet();
        var series: Array<any> = this.searchNodeName("Series", ds);
        if (series.length == 0) {
            var obsArray: Array<any> = this.searchNodeName("Obs", ds);
            for (var i: number = 0; i < obsArray.length; i++) {
                this.dw.newObservation();
                var atts = obsArray[i].attributes;
                for (var av: number = 0; av < atts.length; av++) {
                    this.dw.writeObservationComponent(atts[av].nodeName, atts[av].value);
                }
                this.dw.finishObservation();
            }
        } else {
            for (var i: number = 0; i < series.length; i++) {
                this.dw.newSeries();
                var satts: Array<any> = series[i].attributes;
                for (var av: number = 0; av < satts.length; av++) {
                    this.dw.writeSeriesComponent(satts[av].nodeName, satts[av].value);
                }
                var obsArray: Array<any> = this.searchNodeName("Obs", series[i].childNodes);
                for (var j: number = 0; j < obsArray.length; j++) {
                    this.dw.newObservation();
                    var atts = obsArray[j].attributes;
                    for (var av: number = 0; av < atts.length; av++) {
                        this.dw.writeObservationComponent(atts[av].nodeName, atts[av].value);
                    }
                    this.dw.finishObservation();
                }
                this.dw.finishSeries();
            }

        }
        return this.dw.finishDataSet();
    }

    toHeader(headerNode: any) {
        var header: message.Header = new message.Header();
        header.setId(this.findNodeName("ID", headerNode.childNodes).childNodes[0].nodeValue);
        var test: string = this.findNodeName("Test", headerNode.childNodes).childNodes[0].nodeValue;
        header.setTest(test == "true");
        // truncated not in sdmx 2.1
        //var truncated:string= this.findNodeName("Truncated",headerNode.childNodes).childNodes[0].nodeValue;
        //header.setTruncated(truncated=="true");
        var prepared: string = this.findNodeName("Prepared", headerNode.childNodes).childNodes[0].nodeValue;
        var prepDate: xml.DateTime = xml.DateTime.fromString(prepared);
        header.setPrepared(new message.HeaderTimeType(prepDate));
        header.setSender(this.toSender(this.findNodeName("Sender", headerNode.childNodes)));
        return header;
    }
    toSender(senderNode: any): message.Sender {
        //var sender: string = senderNode.childNodes[0].nodeValue;
        var senderType: message.Sender = new message.Sender();
        var senderId: string = senderNode.getAttribute("id");
        var senderID: commonreferences.ID = new commonreferences.ID(senderId);
        senderType.setId(senderID);
        return senderType;
    }
    toNames(node: any): Array<common.Name> {
        var names: Array<common.Name> = [];
        var senderNames = this.searchNodeName("Name", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toName(senderNames[i]));
        }
        return names;
    }
    toName(node: any): common.Name {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var name: common.Name = new common.Name(lang, text);
        Language.Language.registerLanguage(lang);
        return name;
    }
    toDescriptions(node: any): Array<common.Description> {
        var names: Array<common.Description> = [];
        var senderNames = this.searchNodeName("Description", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toDescription(senderNames[i]));
        }
        return names;
    }
    toDescription(node: any): common.Description {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var desc: common.Description = new common.Description(lang, text);
        Language.Language.registerLanguage(lang);
        return desc;
    }
    toTextType(node: any): common.TextType {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var textType: common.TextType = new common.TextType(lang, text);
        Language.Language.registerLanguage(lang);
        return textType;
    }
    toPartyType(node: any): message.PartyType {
        var pt = new message.PartyType();
        return pt;
    }
    findNodeName(s: string, childNodes: any) {
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) != -1) {
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
            if (nn.indexOf(s) != -1) {
                //alert("found node:"+s);
                result.push(childNodes[i]);
            }
        }
        if (result.length == 0) {
            //alert("cannot find any " + s + " in node");
        }
        return result;
    }
    findTextNode(node: any): string {
        if (node == null) return "";
        var childNodes = node.childNodes;
        for (var i: number = 0; i < childNodes.length; i++) {
            var nodeType = childNodes[i].nodeType;
            if (nodeType == 3) {
                return childNodes[i].nodeValue;
            }
        }
        return "";
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
}
export class Sdmx20GenericDataReaderTools {
    private msg: message.DataMessage = null;
    private dw: data.FlatDataSetWriter = new data.FlatDataSetWriter();

    constructor(s: string) {
        //console.log("sdmx20 parsing data");
        var dom: any = parseXml(s);
        //console.log("sdmx20 creating DataMessage");
        this.msg = this.toDataMessage(this.findGenericDataNode(dom.documentElement));
    }
    findGenericDataNode(node){
        if( node.nodeName.indexOf("GenericData")!=-1&&node.nodeName!="GetGenericDataResult"&&node.nodeName!="GetGenericDataResponse"){
            return node;
        }
        var st = null;
        for(var i:number=0;i<node.childNodes.length&&st==null;i++) {
            st = this.findGenericDataNode(node.childNodes[i]);
            if( st !=null ) {return st;}
        }
        return null;
    }

    getDataMessage(): message.DataMessage { return this.msg; }
    toDataMessage(dm: any): message.DataMessage {
        var msg: message.DataMessage = new message.DataMessage();
        var childNodes = dm.childNodes;
        msg.setHeader(this.toHeader(this.findNodeName("Header", childNodes)));
        var dss = this.toDataSets(this.searchNodeName("DataSet", childNodes));
        for (var i: number = 0; i < dss.length; i++) {
            msg.addDataSet(dss[i]);
        }
        return msg;
    }
    toDataSets(dm: Array<any>): Array<data.FlatDataSet> {
        var dss: Array<data.FlatDataSet> = [];
        for (var i: number = 0; i < dm.length; i++) {
            dss.push(this.toDataSet(dm[i].childNodes));
        }
        return dss;
    }
    toDataSet(ds: any): data.FlatDataSet {
        this.dw.newDataSet();
        var series: Array<any> = this.searchNodeName("Series", ds);
        if (series.length == 0) {
            var obsArray: Array<any> = this.searchNodeName("Obs", ds);
            for (var i: number = 0; i < obsArray.length; i++) {
                this.toObs(obsArray[i], this.dw);
            }
        } else {
            for (var i: number = 0; i < series.length; i++) {
                this.dw.newSeries();
                var seriesKey = this.findNodeName("SeriesKey", series[i].childNodes);
                var satts: Array<any> = this.searchNodeName("Value", seriesKey.childNodes);
                for (var av: number = 0; av < satts.length; av++) {
                    this.dw.writeSeriesComponent(satts[av].getAttribute("concept"), satts[av].getAttribute("value"));
                }
                var obsArray: Array<any> = this.searchNodeName("Obs", series[i].childNodes);
                for (var i: number = 0; i < obsArray.length; i++) {
                    this.toObs(obsArray[i], this.dw);
                }
                this.dw.finishSeries();
            }

        }
        return this.dw.finishDataSet();
    }
    toObs(obs: any, dw: data.FlatDataSetWriter) {
        dw.newObservation();
        var timeNode = this.findNodeName("Time", obs.childNodes);
        var valueNode = this.findNodeName("ObsValue", obs.childNodes);
        var attributesNode = this.findNodeName("Attributes", obs.childNodes);
        if (timeNode != null) {
            dw.writeObservationComponent("TIME_PERIOD", timeNode.childNodes[0].nodeValue);
        }
        if (valueNode != null) {
            dw.writeObservationComponent("OBS_VALUE", valueNode.getAttribute("value"));
        }
        if (attributesNode != null) {
            var attributesArray = this.searchNodeName("Value", attributesNode.childNodes);
            for (var i: number = 0; i < attributesArray.length; i++) {
                dw.writeObservationComponent(attributesArray[i].getAttribute("concept"), attributesArray[i].getAttribute("value"));
            }
        }
        dw.finishObservation();
    }

    toHeader(headerNode: any) {
        var header: message.Header = new message.Header();
        header.setId(this.findNodeName("ID", headerNode.childNodes).childNodes[0].nodeValue);
        var test: string = this.findNodeName("Test", headerNode.childNodes).childNodes[0].nodeValue;
        header.setTest(test == "true");
        // truncated not in sdmx 2.1
        //var truncated:string= this.findNodeName("Truncated",headerNode.childNodes).childNodes[0].nodeValue;
        //header.setTruncated(truncated=="true");
        var prepared: string = this.findNodeName("Prepared", headerNode.childNodes).childNodes[0].nodeValue;
        var prepDate: xml.DateTime = xml.DateTime.fromString(prepared);
        header.setPrepared(new message.HeaderTimeType(prepDate));
        header.setSender(this.toSender(this.findNodeName("Sender", headerNode.childNodes)));
        return header;
    }
    toSender(senderNode: any): message.Sender {
        //var sender: string = senderNode.childNodes[0].nodeValue;
        var senderType: message.Sender = new message.Sender();
        var senderId: string = senderNode.getAttribute("id");
        var senderID: commonreferences.ID = new commonreferences.ID(senderId);
        senderType.setId(senderID);
        return senderType;
    }
    toNames(node: any): Array<common.Name> {
        var names: Array<common.Name> = [];
        var senderNames = this.searchNodeName("Name", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toName(senderNames[i]));
        }
        return names;
    }
    toName(node: any): common.Name {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var name: common.Name = new common.Name(lang, text);
        Language.Language.registerLanguage(lang);
        return name;
    }
    toDescriptions(node: any): Array<common.Description> {
        var names: Array<common.Description> = [];
        var senderNames = this.searchNodeName("Description", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toDescription(senderNames[i]));
        }
        return names;
    }
    toDescription(node: any): common.Description {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var desc: common.Description = new common.Description(lang, text);
        Language.Language.registerLanguage(lang);
        return desc;
    }
    toTextType(node: any): common.TextType {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var textType: common.TextType = new common.TextType(lang, text);
        Language.Language.registerLanguage(lang);
        return textType;
    }
    toPartyType(node: any): message.PartyType {
        var pt = new message.PartyType();
        return pt;
    }
    findNodeName(s: string, childNodes: any) {
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) != -1) {
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
            if (nn.indexOf(s) != -1) {
                //alert("found node:"+s);
                result.push(childNodes[i]);
            }
        }
        if (result.length == 0) {
            //alert("cannot find any " + s + " in node");
        }
        return result;
    }
    findTextNode(node: any): string {
        if (node == null) return "";
        var childNodes = node.childNodes;
        for (var i: number = 0; i < childNodes.length; i++) {
            var nodeType = childNodes[i].nodeType;
            if (nodeType == 3) {
                return childNodes[i].nodeValue;
            }
        }
        return "";
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
}
export class Sdmx20StructureReaderTools {
    private registry: interfaces.LocalRegistry = null;
    private struct: message.StructureType = null;
    private currentKeyFamilyAgency: string = null;

    constructor(s: string, reg: interfaces.LocalRegistry) {
        this.registry = reg;
        var dom: any = parseXml(s);
        var node = dom;

        var structNode = this.findStructureNode(dom.documentElement);
        console.log(structNode);
        this.struct = this.toStructureType(structNode);
    }
    findStructureNode(node){
        if( node.nodeName.indexOf("Structure")!=-1&&node.nodeName!="GetDataStructureDefinitionResult"&&node.nodeName!="GetDataStructureDefinitionResponse"){
            return node;
        }
        var st = null;
        for(var i:number=0;i<node.childNodes.length&&st==null;i++) {
            st = this.findStructureNode(node.childNodes[i]);
            if( st !=null ) {return st;}
        }
        return null;
    }
    toStructureType(structureNode: any): message.StructureType {
        this.struct = new message.StructureType();
        var structures = new structure.Structures();
        this.struct.setStructures(structures);
        if (this.registry == null) {
            this.registry = this.struct;
        } else {
            this.registry = new registry.DoubleRegistry(this.registry, this.struct);
        }
        var childNodes = structureNode.childNodes;
        this.struct.setHeader(this.toHeader(this.findNodeName("Header", childNodes)));
        structures.setCodeLists(this.toCodelists(this.findNodeName("CodeLists", childNodes)));
        structures.setConcepts(this.toConcepts(this.findNodeName("Concepts", childNodes)));
        structures.setDataStructures(this.toKeyFamilies(this.findNodeName("KeyFamilies", childNodes)));
        structures.setDataflows(this.toDataflows(null));
        return this.struct;
    }
    toHeader(headerNode: any) {
        if( headerNode == null ) return null;
        var header: message.Header = new message.Header();
        header.setId(this.findNodeName("ID", headerNode.childNodes).childNodes[0].nodeValue);
        var test: string = this.findNodeName("Test", headerNode.childNodes).childNodes[0].nodeValue;
        header.setTest(test == "true");
        // truncated not in sdmx 2.1
        //var truncated:string= this.findNodeName("Truncated",headerNode.childNodes).childNodes[0].nodeValue;
        //header.setTruncated(truncated=="true");
        var prepared: string = this.findNodeName("Prepared", headerNode.childNodes).childNodes[0].nodeValue;
        var prepDate: xml.DateTime = xml.DateTime.fromString(prepared);
        header.setPrepared(new message.HeaderTimeType(prepDate));
        header.setSender(this.toSender(this.findNodeName("Sender", headerNode.childNodes)));
        return header;
    }
    toSender(senderNode: any): message.Sender {
        if (senderNode == null || senderNode.childNodes == null) return null;
        //var sender: string = senderNode.childNodes[0].nodeValue;
        var senderType: message.Sender = new message.Sender();
        var senderId: string = senderNode.getAttribute("id");
        var senderID: commonreferences.ID = new commonreferences.ID(senderId);
        senderType.setId(senderID);
        return senderType;
    }
    toNames(node: any): Array<common.Name> {
        var names: Array<common.Name> = [];
        var senderNames = this.searchNodeName("Name", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toName(senderNames[i]));
        }
        return names;
    }
    toName(node: any): common.Name {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var name: common.Name = new common.Name(lang, text);
        Language.Language.registerLanguage(lang);
        return name;
    }
    toDescriptions(node: any): Array<common.Description> {
        var names: Array<common.Description> = [];
        var senderNames = this.searchNodeName("Description", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toDescription(senderNames[i]));
        }
        return names;
    }
    toDescription(node: any): common.Description {
        var lang = node.getAttribute("xml:lang");
        if (node.childNodes.length == 0) {
            // <structure:Description xml:lang="en" />
            return new common.Description(lang, "");
        }
        var text = node.childNodes[0].nodeValue;
        var desc: common.Description = new common.Description(lang, text);
        Language.Language.registerLanguage(lang);
        return desc;
    }
    toCodeNames(node: any): Array<common.Name> {
        var names: Array<common.Name> = [];
        var senderNames = this.searchNodeName("Description", node.childNodes);
        for (var i: number = 0; i < senderNames.length; i++) {
            names.push(this.toCodeName(senderNames[i]));
        }
        return names;
    }
    toCodeName(node: any): common.Description {
        var lang = node.getAttribute("xml:lang");
        if (node.childNodes.length == 0) {
            // <structure:Description xml:lang="en" />
            return new common.Name(lang, "");
        }
        var text = node.childNodes[0].nodeValue;
        var name: common.Name = new common.Name(lang, text);
        Language.Language.registerLanguage(lang);
        return name;
    }
    toTextType(node: any): common.TextType {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var textType: common.TextType = new common.TextType(lang, text);
        Language.Language.registerLanguage(lang);
        return textType;
    }
    toPartyType(node: any): message.PartyType {
        var pt = new message.PartyType();
        return pt;
    }
    toDataflows(dataflowsNode: any): structure.DataflowList {
        var dl: structure.DataflowList = new structure.DataflowList();

        return dl;
    }
    toDataflow(dataflowNode: any): structure.Dataflow {
        var df: structure.Dataflow = new structure.Dataflow();
        df.setNames(this.toNames(dataflowNode));
        df.setId(this.toID(dataflowNode));
        df.setAgencyId(this.toNestedNCNameID(dataflowNode));
        df.setVersion(this.toVersion(dataflowNode));
        return df;
    }
    toCodelists(codelistsNode: any) {
        if (codelistsNode == null) return null;
        var codelists: structure.CodeLists = new structure.CodeLists();
        var codes = this.searchNodeName("CodeList", codelistsNode.childNodes);
        for (var i: number = 0; i < codes.length; i++) {
            codelists.getCodelists().push(this.toCodelist(codes[i]));
        }
        return codelists;
    }
    toID(node: any): commonreferences.ID {
        if (node == null) return null;
        return new commonreferences.ID(node.getAttribute("id"));
    }
    toNestedNCNameID(node: any): commonreferences.NestedNCNameID {
        if (node == null) return null;
        return new commonreferences.NestedNCNameID(node.getAttribute("agencyID"));
    }
    toVersion(node: any): commonreferences.Version {
        if (node == null) return null;
        if (node.getAttribute("version") == "" || node.getAttribute("version") == null) {
            return commonreferences.Version.ONE;
        }
        return new commonreferences.Version(node.getAttribute("version"));
    }
    toCodelist(codelistNode: any) {
        var cl: structure.Codelist = new structure.Codelist();
        cl.setNames(this.toNames(codelistNode));
        cl.setId(this.toID(codelistNode));
        cl.setAgencyId(this.toNestedNCNameID(codelistNode));
        cl.setVersion(this.toVersion(codelistNode));
        var codeNodes = this.searchNodeName("Code", codelistNode.childNodes);
        for (var i: number = 0; i < codeNodes.length; i++) {
            cl.getItems().push(this.toCode(codeNodes[i]));
        }
        return cl;
    }
    toCode(codeNode: any): structure.CodeType {
        var c: structure.CodeType = new structure.CodeType();
        // Codes in SDMX 2.1 have Names, not Descriptions.. here we change the
        // description to a name instead.
        //c.setDescriptions(this.toDescriptions(codeNode));
        c.setNames(this.toCodeNames(codeNode));
        c.setId(this.toValue(codeNode));
        if (codeNode.getAttribute("parentCode") != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setId(new commonreferences.ID(codeNode.getAttribute("parentCode")));
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            c.setParent(reference);
        }
        return c;
    }
    getParentCode(codeNode: any): commonreferences.ID {
        var id = codeNode.getAttribute("parentCode");
        if (id == null) { return null; }
        else {
            return new commonreferences.ID(id);
        }
    }
    toValue(codeNode: any): commonreferences.ID {
        if (codeNode == null) return null;
        var id = codeNode.getAttribute("value");
        return new commonreferences.ID(id);
    }
    toConcepts(conceptsNode: any) {
        if (conceptsNode == null) return null;
        var concepts: structure.Concepts = new structure.Concepts();
        this.struct.getStructures().setConcepts(concepts);
        var csNodes = this.searchNodeName("ConceptScheme", conceptsNode.childNodes);
        for (var i: number = 0; i < csNodes.length; i++) {
            concepts.getConceptSchemes().push(this.toConceptScheme(csNodes[i]));
        }
        if (csNodes.length == 0) {
            var conNodes = this.searchNodeName("Concept", conceptsNode.childNodes);
            for (var i: number = 0; i < conNodes.length; i++) {
                var conceptScheme: structure.ConceptSchemeType = this.findStandaloneConceptScheme(this.toNestedNCNameID(conNodes[i]));
                this.toConcept(conceptScheme, conNodes[i]);
            }
        }
        return concepts;
    }
    findStandaloneConceptScheme(ag: commonreferences.NestedNCNameID): structure.ConceptSchemeType {
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setAgencyId(ag);
        ref.setMaintainableParentId(new commonreferences.ID("STANDALONE_CONCEPT_SCHEME"));
        ref.setVersion(null);
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        var cs: structure.ConceptSchemeType = this.struct.findConceptScheme(reference);
        if (cs == null) {
            cs = new structure.ConceptSchemeType();
            cs.setAgencyId(ag);
            cs.setId(new commonreferences.ID("STANDALONE_CONCEPT_SCHEME"));
            cs.setVersion(commonreferences.Version.ONE);
            var name: common.Name = new common.Name("en", "Standalone Concept Scheme");
            cs.setNames([name]);
            this.struct.getStructures().getConcepts().getConceptSchemes().push(cs);
        }
        return cs;
    }
    toConceptScheme(conceptSchemeNode: any) {
        if (conceptSchemeNode == null) return null;
        var cs: structure.ConceptSchemeType = new structure.ConceptSchemeType();
        cs.setNames(this.toNames(conceptSchemeNode))
        cs.setAgencyId(this.toNestedNCNameID(conceptSchemeNode));
        cs.setId(this.toID(conceptSchemeNode));
        cs.setVersion(this.toVersion(conceptSchemeNode));
        var conceptNodes = this.searchNodeName("Concept", conceptSchemeNode.childNodes);
        for (var i = 0; i < conceptNodes.length; i++) {
            this.toConcept(cs, conceptNodes[i]);
        }
        return cs;
    }
    toConcept(conceptScheme: structure.ConceptSchemeType, conceptNode: any) {
        if (conceptNode == null) {
            return null;
        }
        var con: structure.ConceptType = new structure.ConceptType();
        con.setNames(this.toNames(conceptNode));
        con.setDescriptions(this.toDescriptions(conceptNode));
        con.setId(this.toID(conceptNode));
        conceptScheme.getItems().push(con);
    }
    toKeyFamilies(keyFamiliesNode: any) {
        if (keyFamiliesNode == null) return null;
        var dst: structure.DataStructures = new structure.DataStructures();
        var kfNodes = this.searchNodeName("KeyFamily", keyFamiliesNode.childNodes);
        for (var i: number = 0; i < kfNodes.length; i++) {
            dst.getDataStructures().push(this.toDataStructure(kfNodes[i]));
        }
        return dst;
    }
    toDataStructure(keyFamilyNode: any): structure.DataStructure {
        var dst: structure.DataStructure = new structure.DataStructure();
        dst.setNames(this.toNames(keyFamilyNode));
        dst.setId(this.toID(keyFamilyNode));
        this.currentKeyFamilyAgency = keyFamilyNode.getAttribute("agencyID");
        dst.setAgencyId(this.toNestedNCNameID(keyFamilyNode));
        dst.setVersion(this.toVersion(keyFamilyNode));
        dst.setDataStructureComponents(this.toDataStructureComponents(this.findNodeName("Components", keyFamilyNode.childNodes)));
        //this.recurseDomChildren(keyFamilyNode, true);
        return dst;
    }
    toDataStructureComponents(dsc: any): structure.DataStructureComponents {
        if (dsc == null) return null;
        var components: structure.DataStructureComponents = new structure.DataStructureComponents();
        var dimensions = this.searchNodeName("Dimension", dsc.childNodes);
        var timedimension = this.findNodeName("TimeDimension", dsc.childNodes);
        // TimeDimension gets stuck in dimensions sometimes :)
        collections.arrays.remove(dimensions, timedimension);
        var primaryMeasure = this.findNodeName("PrimaryMeasure", dsc.childNodes);
        var attributes = this.searchNodeName("Attribute", dsc.childNodes);
        components.setDimensionList(this.toDimensionList(dimensions));
        if (timedimension != null) {
            this.toTimeDimension(components, timedimension);
        }
        this.toPrimaryMeasure(components, primaryMeasure);
        components.setAttributeList(this.toAttributeList(attributes));
        /*
        for (var i: number = 0; i < dimensions.length; i++) {
            this.recurseDomChildren(dimensions[i].childNodes, true);
        }
        this.recurseDomChildren(timedimension.childNodes, true);
        this.recurseDomChildren(primaryMeasure.childNodes, true);
        for (var i: number = 0; i < attributes.length; i++) {
            this.recurseDomChildren(attributes[i].childNodes, true);
        }
        */
        return components;
    }
    toDimensionList(dims: Array<any>): structure.DimensionList {
        if( dims == null ) {return null;}
        var dimList: structure.DimensionList = new structure.DimensionList();
        var dimArray: Array<structure.Dimension> = [];
        for (var i: number = 0; i < dims.length; i++) {
            if (dims[i].getAttribute("isMeasureDimension") == "true") {
                dimList.setMeasureDimension(this.toMeasureDimension(dims[i]));
            } else {
                // Sometimes Time Dimension seems to get mistakenly sucked
                // into this list too :(
                if (dims[i].nodeName.indexOf("TimeDimension") == -1) {
                    dimArray.push(this.toDimension(dims[i]));
                }
            }
        }
        dimList.setDimensions(dimArray);
        return dimList;
    }
    toAttributeList(dims: Array<any>): structure.AttributeList {
        var dimList: structure.AttributeList = new structure.AttributeList();
        var dimArray: Array<structure.Attribute> = [];
        for (var i: number = 0; i < dims.length; i++) {
            dimArray.push(this.toAttribute(dims[i]));
        }
        dimList.setAttributes(dimArray);
        return dimList;
    }
    toTimeDimension(comps: structure.DataStructureComponents, dim: any) {
        var dim2: structure.TimeDimension = new structure.TimeDimension();
        var cs: structure.ConceptSchemeType = this.getConceptScheme(dim);
        var cl: structure.Codelist = this.getCodelist(dim);
        var con: structure.ConceptType = this.getConcept(cs, dim);
        if (dim.getAttribute("conceptRef") != null) {
            dim2.setId(new commonreferences.ID(dim.getAttribute("conceptRef")));
        }
        if (con != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(cs.getAgencyId());
            ref.setMaintainableParentId(cs.getId());
            ref.setVersion(cs.getVersion());
            ref.setId(con.getId());
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            dim2.setConceptIdentity(reference);
        }
        if (cl != null) {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(cl, ttf));
        } else {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(null, ttf));
        }
        comps.getDimensionList().setTimeDimension(dim2);
    }
    toPrimaryMeasure(comps: structure.DataStructureComponents, dim: any) {
        var dim2: structure.PrimaryMeasure = new structure.PrimaryMeasure();
        var cs: structure.ConceptSchemeType = this.getConceptScheme(dim);
        var cl: structure.Codelist = this.getCodelist(dim);
        var con: structure.ConceptType = this.getConcept(cs, dim);
        if (dim.getAttribute("conceptRef") != null) {
            dim2.setId(new commonreferences.ID(dim.getAttribute("conceptRef")));
        }
        if (con != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(cs.getAgencyId());
            ref.setMaintainableParentId(cs.getId());
            ref.setVersion(cs.getVersion());
            ref.setId(con.getId());
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            dim2.setConceptIdentity(reference);
        } else {
            alert("con is null cs=" + JSON.stringify(cs) + "con=" + JSON.stringify(con));

        }
        if (cl != null) {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(cl, ttf));
        } else {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(null, ttf));
        }
        comps.getMeasureList().setPrimaryMeasure(dim2);
    }
    toDimension(dim: any): structure.Dimension {
        var dim2: structure.Dimension = new structure.Dimension();
        var cs: structure.ConceptSchemeType = this.getConceptScheme(dim);
        var cl: structure.Codelist = this.getCodelist(dim);
        var con: structure.ConceptType = this.getConcept(cs, dim);
        if (dim.getAttribute("conceptRef") != null) {
            dim2.setId(new commonreferences.ID(dim.getAttribute("conceptRef")));
        }
        if (con != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(cs.getAgencyId());
            ref.setMaintainableParentId(cs.getId());
            ref.setVersion(cs.getVersion());
            ref.setId(con.getId());
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            dim2.setConceptIdentity(reference);
        }
        if (cl != null) {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(cl, ttf));
        } else {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(null, ttf));
        }
        return dim2;
    }
    toAttribute(dim: any): structure.Attribute {
        var dim2: structure.Attribute = new structure.Attribute();
        var cs: structure.ConceptSchemeType = this.getConceptScheme(dim);
        var cl: structure.Codelist = this.getCodelist(dim);
        var con: structure.ConceptType = this.getConcept(cs, dim);
        if (dim.getAttribute("conceptRef") != null) {
            dim2.setId(new commonreferences.ID(dim.getAttribute("conceptRef")));
        }
        if (con != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(cs.getAgencyId());
            ref.setMaintainableParentId(cs.getId());
            ref.setVersion(cs.getVersion());
            ref.setId(con.getId());
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            dim2.setConceptIdentity(reference);
        }
        if (cl != null) {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(cl, ttf));
        } else {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(null, ttf));
        }
        return dim2;
    }
    public toTextFormatType(tft: any): structure.TextFormatType {
        if (tft == null) {
            return null;
        }
        var tft2: structure.TextFormatType = new structure.TextFormatType();
        if (tft.getAttribute("decimals") != null) {
            tft2.setDecimals(parseInt(tft.getAttribute("decimals")));
        }
        if (tft.getAttribute("endValue") != null) { tft2.setEndValue(parseInt(tft.getAttribute("endValue"))); }
        if (tft.getAttribute("isSequence") != null) {
            tft2.setIsSequence(tft.getAttribute("isSequence") == "true");
            if (tft.getAttribute("interval") != null) { tft2.setInterval(parseInt(tft.getAttribute("interval"))); }
        }
        if (tft.getAttribute("maxLength") != null) {
            tft2.setMaxLength(parseInt(tft.getAttribute("maxLength")));
        }
        if (tft.getAttribute("pattern") != null) {
            tft2.setPattern(tft.getAttribute("pattern"));
        }
        if (tft.getAttribute("startValue")) { tft2.setStartValue(parseInt(tft.getAttribute("startValue"))); }
        if (tft.getAttribute("textType") != null) {
            tft2.setTextType(common.DataType.fromStringWithException(tft.getAttribute("textType")));
        }
        if (tft.getAttribute("timeInterval") != null) {
            // DO ME!!!!
            tft2.setTimeInterval(null);
        }
        return tft2;
    }
    toLocalRepresentation(codelist: structure.Codelist, ttf: structure.TextFormatType): structure.RepresentationType {
        var lr2: structure.RepresentationType = new structure.RepresentationType();
        lr2.setTextFormat(ttf);
        if (codelist != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(codelist.getAgencyId());
            ref.setMaintainableParentId(codelist.getId());
            ref.setVersion(codelist.getVersion());
            var reference = new commonreferences.Reference(ref, null);
            reference.setPack(commonreferences.PackageTypeCodelistType.CODELIST);
            reference.setRefClass(commonreferences.ObjectTypeCodelistType.CODELIST);
            lr2.setEnumeration(reference);
        }
        return lr2;
    }
    toLocalRepresentationConceptScheme(conceptScheme: structure.ConceptSchemeType, ttf: structure.TextFormatType): structure.RepresentationType {
        var lr2: structure.RepresentationType = new structure.RepresentationType();
        lr2.setTextFormat(ttf);
        if (conceptScheme != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(conceptScheme.getAgencyId());
            ref.setMaintainableParentId(conceptScheme.getId());
            ref.setVersion(conceptScheme.getVersion());
            var reference = new commonreferences.Reference(ref, null);
            reference.setPack(commonreferences.PackageTypeCodelistType.CONCEPTSCHEME);
            reference.setRefClass(commonreferences.ObjectTypeCodelistType.CONCEPTSCHEME)
            lr2.setEnumeration(reference);
        }
        return lr2;
    }
    getCodelist(dim: any): structure.Codelist {
        if (dim.getAttribute("codelist") == null) {
            return null;
        }
        var code: structure.Codelist = null;
        if (dim.getAttribute("codelistAgency") == null && dim.getAttribute("codelistVersion") == null) {
            // All we have is a codelist name
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(new commonreferences.NestedNCNameID(this.currentKeyFamilyAgency));
            ref.setMaintainableParentId(new commonreferences.ID(dim.getAttribute("codelist")));
            ref.setVersion(null);
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            code = this.registry.findCodelist(reference);
        } else if (dim.getAttribute("codelistAgency") != null && dim.getAttribute("codelistVersion") != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(new commonreferences.NestedNCNameID(dim.getAttribute("codelistAgency")));
            ref.setMaintainableParentId(new commonreferences.ID(dim.getAttribute("codelist")));
            ref.setVersion(new commonreferences.Version(dim.getAttribute("codelistVersion")));
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            code = this.registry.findCodelist(reference);
        } else if (dim.getAttribute("codelistAgency") != null && dim.getAttribute("codelistVersion") == null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(new commonreferences.NestedNCNameID(dim.getAttribute("codelistAgency")));
            ref.setMaintainableParentId(new commonreferences.ID(dim.getAttribute("codelist")));
            ref.setVersion(null);
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            code = this.registry.findCodelist(reference);
        }
        return code;
    }
    getConceptScheme(dim: any): structure.ConceptSchemeType {
        if ((dim.getAttribute("conceptSchemeAgency") != null || dim.getAttribute("conceptAgency") != null) && dim.getAttribute("conceptSchemeRef") != null && dim.getAttribute("conceptRef") != null) {
            var csa: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(dim.getAttribute("conceptSchemeAgency") == null ? dim.getAttribute("conceptAgency") : dim.getAttribute("conceptSchemeAgency"));
            var csi: commonreferences.ID = new commonreferences.ID(dim.getAttribute("conceptSchemeRef"));
            var vers: commonreferences.Version = dim.getAttribute("conceptVersion") == null ? null : new commonreferences.Version(dim.getAttribute("conceptVersion"));
            var csref: commonreferences.Ref = new commonreferences.Ref();
            csref.setAgencyId(csa);
            csref.setMaintainableParentId(csi);
            csref.setVersion(vers);
            var reference: commonreferences.Reference = new commonreferences.Reference(csref, null);
            var cst: structure.ConceptSchemeType = null;
            cst = this.struct.findConceptScheme(reference);
            if (cst != null) return cst;
            cst = this.registry.findConceptScheme(reference);
            if (cst != null) return cst;
        } else if (dim.getAttribute("conceptSchemeRef") != null && dim.getAttribute("conceptRef") != null) {
            var csa: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(this.currentKeyFamilyAgency);
            var csi: commonreferences.ID = new commonreferences.ID(dim.getAttribute("conceptSchemeRef"));
            var vers: commonreferences.Version = dim.getAttribute("conceptVersion") == null ? null : new commonreferences.Version(dim.getAttribute("conceptVersion"));
            var csref: commonreferences.Ref = new commonreferences.Ref();
            csref.setAgencyId(csa);
            csref.setMaintainableParentId(csi);
            csref.setVersion(vers);
            var reference: commonreferences.Reference = new commonreferences.Reference(csref, null);
            var cst: structure.ConceptSchemeType = null;
            cst = this.struct.findConceptScheme(reference);
            if (cst != null) return cst;
            cst = this.registry.findConceptScheme(reference);
            if (cst != null) return cst;
        } else if (dim.getAttribute("conceptRef") != null && dim.getAttribute("conceptAgency") == null) {
            var csa: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(this.currentKeyFamilyAgency);
            var csi: commonreferences.ID = new commonreferences.ID("STANDALONE_CONCEPT_SCHEME");
            var vers: commonreferences.Version = dim.getAttribute("conceptVersion") == null ? null : new commonreferences.Version(dim.getAttribute("conceptVersion"));
            var csref: commonreferences.Ref = new commonreferences.Ref();
            csref.setAgencyId(csa);
            csref.setMaintainableParentId(csi);
            csref.setVersion(vers);
            var reference: commonreferences.Reference = new commonreferences.Reference(csref, null);
            var cst: structure.ConceptSchemeType = null;
            cst = this.struct.findConceptScheme(reference);
            if (cst != null) {
                if (cst.findItemString(dim.getAttribute("conceptRef")) != null) {
                    return cst;
                } else {
                    //alert("can't find concpetscheme in currentKeyfamilyAgency:STANDALONE CS");
                }
            }
            cst = this.registry.findConceptScheme(reference);
            if (cst != null) {
                if (cst.findItemString(dim.getAttribute("conceptRef")) != null) {
                    return cst;
                } else {
                    //alert("can't find concpetscheme in registry:STANDALONE CS");
                }
            }
           
            // 
            // This is a trick for ABS SDMX Documents, which have
            // a Primary Measure and all it has is a conceptRef of "OBS_VALUE"
            // this points to a Primary Measure Concept that belongs to the OECD Agency :(
            // this code looks through the structure's conceptschemes, and finds a concept
            // in the document that has the same ID as the conceptRef..
            // this is really all i can do with this situation :(
            var css = this.struct.getStructures().getConcepts().getConceptSchemes();
            for (var i: number = 0; i < css.length; i++) {
                for (var j: number = 0; j < css[i].size(); j++) {
                    var concept = css[i].getItem(j);
                    if (concept.getId().equalsString(dim.getAttribute("conceptRef"))) {
                        return css[i];
                    }
                }
            }
            alert("Can't find concept scheme for concept: " + dim.getAttribute("conceptRef"));
            return null;
        } else if (dim.getAttribute("conceptRef")() != null && dim.getAttribute("conceptAgency") != null) {
            var csa: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(dim.getAttribute("conceptAgency"));
            var csi: commonreferences.ID = new commonreferences.ID("STANDALONE_CONCEPT_SCHEME");
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(csa);
            ref.setId(csi);
            ref.setVersion(commonreferences.Version.ONE);
            var ref2: commonreferences.Reference = new commonreferences.Reference(ref, null);
            var cst: structure.ConceptSchemeType = null;
            cst = this.struct.findConceptScheme(ref2);
            if (cst != null) return cst;
            cst = this.registry.findConceptScheme(ref2);
            if (cst != null) return cst;
        }
        if (dim.getAttribute("conceptRef") != null) {
            // 
            // This is a trick for ABS SDMX Documents, which have
            // a Primary Measure and all it has is a conceptRef of "OBS_VALUE"
            // this points to a Primary Measure Concept that belongs to the OECD Agency :(
            var css = this.struct.getStructures().getConcepts().getConceptSchemes();
            for (var i: number = 0; i < css.length; i++) {
                for (var j: number = 0; j < css[i].size(); j++) {
                    var concept = css[i].getItem(j);
                    if (concept.getId().equalsString(dim.getAttribute("conceptRef"))) {
                        return css[i];
                    }
                }
            }
            alert("Can't find concept scheme for concept: " + dim.getAttribute("conceptRef"));
            return null;
        }
        alert("Falling through getConceptScheme");
        return null;
    }
    getConcept(cs: structure.ConceptSchemeType, dim: any) {
        if (cs != null) {
            var concept: structure.ConceptType = cs.findItemString(dim.getAttribute("conceptRef"));
            return concept;
        } else return null;
    }
    findConcept(conceptRef: string): structure.ConceptType {
        var csa: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(this.currentKeyFamilyAgency);
        var csi: commonreferences.ID = new commonreferences.ID(conceptRef);
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setAgencyId(csa);
        ref.setId(csi);
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        var ct: structure.ConceptType = this.registry.findConcept(reference);
        if (ct == null) {
            var ref2: commonreferences.Ref = new commonreferences.Ref();
            ref2.setId(csi);
            var reference2: commonreferences.Reference = new commonreferences.Reference(ref2, null);
            return this.registry.findConcept(reference2);
        }
        return ct;
    }
    toMeasureDimension(dim: any): structure.MeasureDimension {
        var dim2: structure.MeasureDimension = new structure.MeasureDimension();
        var cs: structure.ConceptSchemeType = this.getConceptScheme(dim);
        var cl: structure.ConceptSchemeType = this.getCodelist(dim);
        var con: structure.ConceptType = this.getConcept(cs, dim);
        if (dim.getAttribute("conceptRef") != null) {
            dim2.setId(new commonreferences.ID(dim.getAttribute("conceptRef")));
        }
        if (con != null) {
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setAgencyId(cs.getAgencyId());
            ref.setMaintainableParentId(cs.getId());
            ref.setVersion(cs.getVersion());
            ref.setId(con.getId());
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            dim2.setConceptIdentity(reference);
        }
        // Sdmx 2.1 files have concept schemes
        // for cross sectional measures...
        var createdConceptScheme: structure.ConceptSchemeType = new structure.ConceptSchemeType();
        createdConceptScheme.setAgencyId(cl.getAgencyId());
        createdConceptScheme.setId(cl.getId());
        createdConceptScheme.setVersion(cl.getVersion());
        createdConceptScheme.setNames(cl.getNames());
        createdConceptScheme.setDescriptions(cl.getDescriptions());
        for (var i: number = 0; i < cl.size(); i++) {
            var code: structure.ItemType = cl.getItem(i);
            var concept: structure.ConceptType = new structure.ConceptType();
            concept.setId(code.getId());
            concept.setParent(code.getParent());
            concept.setURN(code.getURN());
            concept.setURI(code.getURI());
            concept.setNames(code.getNames());
            concept.setDescriptions(code.getDescriptions());
            //concept.setAnnotations(code.getAnnotations());
            createdConceptScheme.addItem(concept);
        }
        if (this.struct.getStructures().getConcepts() == null) {
            this.struct.getStructures().setConcepts(new structure.Concepts());
        }
        this.struct.getStructures().getConcepts().getConceptSchemes().push(createdConceptScheme);
        if (cl != null) {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentationConceptScheme(cl, ttf))
        } else {
            var ttf: structure.TextFormatType = this.toTextFormatType(this.findNodeName("TextFormat", dim.childNodes));
            dim2.setLocalRepresentation(this.toLocalRepresentation(null, ttf))
        }
        return dim2;
    }

    getStructureType(): message.StructureType {
        return this.struct;
    }
    findNodeName(s: string, childNodes: any) {
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) != -1) {
                //alert("found node:"+s);
                return childNodes[i];
            }
        }
        //console.log("can't find node:"+s);
        return null;
    }
    searchNodeName(s: string, childNodes: any): Array<any> {
        var result: Array<any> = [];
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) != -1) {
                //alert("found node:"+s);
                result.push(childNodes[i]);
            }
        }
        if (result.length == 0) {
            //alert("cannot find any " + s + " in node");
            //console.log("can't search node:"+s);
        }
        return result;
    }
    findTextNode(node: any): string {
        if (node == null) return "";
        var childNodes = node.childNodes;
        for (var i: number = 0; i < childNodes.length; i++) {
            var nodeType = childNodes[i].nodeType;
            if (nodeType == 3) {
                return childNodes[i].nodeValue;
            }
        }
        return "";
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
}
