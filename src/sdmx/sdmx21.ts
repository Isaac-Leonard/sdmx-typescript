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

export class Sdmx21StructureParser implements interfaces.SdmxParserProvider {
    constructor() {

    }
    getVersionIdentifier(): number {
        return 2.1;
    }
    canParse(input: string): boolean {
        if (input == null) return false;
        if (this.isStructure(input)) return true;
        if (this.isData(input)) return true;
    }
    isStructure(input: string): boolean {
        if (input.indexOf("Structure") != -1 && input.indexOf("http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message") != -1) {
            return true;
        } else return false;
    }
    isData(input: string): boolean {
        if (this.isStructureSpecificData(input)) {
            return true;
        } else if (this.isGenericData(input)) { return true; }
        else return false;
    }
    public isGenericData(input: string) {
        if (input.indexOf("GenericData") != -1 && input.indexOf("http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message") != -1) {
            return true;
        } else return false;
    }
    public isStructureSpecificData(input: string) {
        if (input.indexOf("StructureSpecificData") != -1 && input.indexOf("http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message") != -1) {
            return true;
        } else return false;
    }
    isMetadata(header: string): boolean {
        return false;
    }
    parseStructureWithRegistry(input: string, reg: interfaces.LocalRegistry): message.StructureType {
        var srt: Sdmx21StructureReaderTools = new Sdmx21StructureReaderTools(input, reg);
        return srt.getStructureType();

    }
    parseStructure(input: string): message.StructureType {
        var srt: Sdmx21StructureReaderTools = new Sdmx21StructureReaderTools(input, null);
        return srt.getStructureType();

    }
    parseData(input: string): message.DataMessage {
        if (this.isGenericData(input)) {
            var parser: Sdmx21GenericDataReaderTools = new Sdmx21GenericDataReaderTools(input);
            return parser.getDataMessage();
        } else if (this.isStructureSpecificData(input)) {
            var parser2: Sdmx21StructureSpecificDataReaderTools = new Sdmx21StructureSpecificDataReaderTools(input);
            return parser2.getDataMessage();
        }

    }
}
export class Sdmx21StructureSpecificDataReaderTools {
    private msg: message.DataMessage = null;
    private dw: data.FlatDataSetWriter = new data.FlatDataSetWriter();

    constructor(s: string) {
        //console.log("sdmx20 parsing data");
        var dom: any = parseXml(s);
        //console.log("sdmx20 creating DataMessage");
        this.msg = this.toDataMessage(dom.documentElement);
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
        return desc;
    }
    toTextType(node: any): common.TextType {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var textType: common.TextType = new common.TextType(lang, text);
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
export class Sdmx21GenericDataReaderTools {
    private msg: message.DataMessage = null;
    private dw: data.FlatDataSetWriter = new data.FlatDataSetWriter();
    private dimensionAtObservation = "TIME_PERIOD";

    constructor(s: string) {
        //console.log("sdmx20 parsing data");
        var dom: any = parseXml(s);
        //console.log("sdmx20 creating DataMessage");
        this.msg = this.toDataMessage(dom.documentElement);
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
                var obsDimensionNode = this.findNodeName("ObsDimension", obsArray[i].childNodes);
                this.dw.writeObservationComponent(this.dimensionAtObservation, obsDimensionNode.getAttribute("value"));
                var obsValueNode = this.findNodeName("ObsValue", obsArray[i].childNodes);
                // "OBS_VALUE is hard coded into SDMX 2.1
                this.dw.writeObservationComponent("OBS_VALUE", obsValueNode.getAttribute("value"));
                var attNode = this.findNodeName("Attributes", obsArray[i].childNodes);
                if (attNode != null) {
                    var attNodes = this.searchNodeName("Value", attNode.childNodes);
                    for (var av: number = 0; av < attNodes.length; av++) {
                        this.dw.writeObservationComponent(attNodes[av].getAttribute("id"), attNodes[av].getAttribute("value"));
                    }
                }
                this.dw.finishObservation();
            }
        } else {
            for (var i: number = 0; i < series.length; i++) {
                this.dw.newSeries();
                var satts: Array<any> = series[i].attributes;
                var seriesKeysNode = this.findNodeName("SeriesKey", series[i].childNodes);
                var keyNodes = this.searchNodeName("Value", seriesKeysNode.childNodes);
                for (var av: number = 0; av < keyNodes.length; av++) {
                    this.dw.writeSeriesComponent(keyNodes[av].getAttribute("id"), keyNodes[av].getAttribute("value"));
                }
                var obsArray: Array<any> = this.searchNodeName("Obs", series[i].childNodes);
                for (var j: number = 0; j < obsArray.length; j++) {
                    this.dw.newObservation();
                    var obsDimensionNode = this.findNodeName("ObsDimension", obsArray[j].childNodes);
                    this.dw.writeObservationComponent(this.dimensionAtObservation, obsDimensionNode.getAttribute("value"));
                    var obsValueNode = this.findNodeName("ObsValue", obsArray[j].childNodes);
                    // "OBS_VALUE is hard coded into SDMX 2.1
                    this.dw.writeObservationComponent("OBS_VALUE", obsValueNode.getAttribute("value"));
                    var attNode = this.findNodeName("Attributes", obsArray[j].childNodes);
                    if (attNode != null) {
                        var attNodes = this.searchNodeName("Value", attNode.childNodes);
                        for (var av: number = 0; av < attNodes.length; av++) {
                            this.dw.writeObservationComponent(attNodes[av].getAttribute("id"), attNodes[av].getAttribute("value"));
                        }
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
        header.setStructures([this.toStructure(this.findNodeName("Structure", headerNode.childNodes))]);
        return header;
    }
    toStructure(structureNode: any): common.PayloadStructureType {
        this.dimensionAtObservation = structureNode.getAttribute("dimensionAtObservation");
        var refNode = this.findNodeName("Ref", structureNode.childNodes);
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setMaintainableParentId(this.toID(refNode));
        ref.setAgencyId(this.toNestedNCNameID(refNode));
        ref.setVersion(this.toVersion(refNode));
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        var payload: common.PayloadStructureType = new common.PayloadStructureType();
        payload.setStructure(reference);
        return payload;
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
        return desc;
    }
    toTextType(node: any): common.TextType {
        var lang = node.getAttribute("xml:lang");
        var text = node.childNodes[0].nodeValue;
        var textType: common.TextType = new common.TextType(lang, text);
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
    toID(node: any): commonreferences.ID {
        if (node == null) return null;
        return new commonreferences.ID(node.getAttribute("id"));
    }
    toMaintainableParentID(node: any): commonreferences.ID {
        if (node == null) return null;
        return new commonreferences.ID(node.getAttribute("maintainableParentID"));
    }
    toNestedID(node: any): commonreferences.NestedID {
        if (node == null) return null;
        return new commonreferences.NestedID(node.getAttribute("id"));
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
}
export class Sdmx21StructureReaderTools {
    private registry: interfaces.LocalRegistry = null;
    private struct: message.StructureType = null;
    private currentKeyFamilyAgency: string = null;

    constructor(s: string, reg: interfaces.LocalRegistry) {
        this.registry = reg;
        var dom: any = parseXml(s);
        this.struct = this.toStructureType(dom.documentElement);
    }
    toStructureType(structureNode: any): message.StructureType {
        this.struct = new message.StructureType();
        var structures: structure.Structures = new structure.Structures();
        this.struct.setStructures(structures);
        if (this.registry == null) {
            this.registry = this.struct;
        } else {
            this.registry = new registry.DoubleRegistry(this.registry, this.struct);
        }
        var childNodes = structureNode.childNodes;
        this.struct.setHeader(this.toHeader(this.findNodeName("Header", childNodes)));
        var structuresNode: any = this.findNodeName("Structures", childNodes);
        childNodes = structuresNode.childNodes;
        structures.setCodeLists(this.toCodelists(this.findNodeName("Codelists", childNodes)));
        structures.setConcepts(this.toConcepts(this.findNodeName("Concepts", childNodes)));
        structures.setDataStructures(this.toDataStructures(this.findNodeName("DataStructures", childNodes)));
        structures.setDataflows(this.toDataflows(this.findNodeName("Dataflows", childNodes)));
        return this.struct;
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
        var receivers = [];
        for (var i: number = 0; i < this.searchNodeName("Receiver", headerNode.childNodes).length; i++) {
            receivers.push(this.toReceiver(this.searchNodeName("Receiver", headerNode.childNodes)[i]));
        }
        header.setReceivers(receivers);
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
    toReceiver(receiverNode: any): message.PartyType {
        //var sender: string = receiverNode.childNodes[0].nodeValue;
        var receiverType: message.PartyType = new message.PartyType();
        var senderId: string = receiverNode.getAttribute("id");
        var senderID: commonreferences.ID = new commonreferences.ID(senderId);
        receiverType.setId(senderID);
        return receiverType;
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
        if (dataflowsNode == null) return null;
        var dl: structure.DataflowList = new structure.DataflowList();
        var dfs = this.searchNodeName("Dataflow", dataflowsNode.childNodes);
        var dataflows = [];
        for (var i: number = 0; i < dfs.length; i++) {
            dataflows.push(this.toDataflow(dfs[i]));
        }
        dl.setDataflowList(dataflows);
        return dl;
    }
    toDataflow(dataflowNode: any): structure.Dataflow {
        var df: structure.Dataflow = new structure.Dataflow();
        df.setNames(this.toNames(dataflowNode));
        df.setId(this.toID(dataflowNode));
        df.setAgencyId(this.toNestedNCNameID(dataflowNode));
        df.setVersion(this.toVersion(dataflowNode));
        var struct = this.findNodeName("Structure", dataflowNode.childNodes);
        var refNode = this.findNodeName("Ref", struct.childNodes);
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setAgencyId(this.toNestedNCNameID(refNode));
        ref.setMaintainableParentId(this.toID(refNode));
        ref.setVersion(this.toVersion(refNode));
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        df.setStructure(reference);
        return df;
    }
    toCodelists(codelistsNode: any) {
        if (codelistsNode == null) return null;
        var codelists: structure.CodeLists = new structure.CodeLists();
        var codes = this.searchNodeName("Codelist", codelistsNode.childNodes);
        for (var i: number = 0; i < codes.length; i++) {
            codelists.getCodelists().push(this.toCodelist(codes[i]));
        }
        return codelists;
    }
    toID(node: any): commonreferences.ID {
        if (node == null) return null;
        return new commonreferences.ID(node.getAttribute("id"));
    }
    toMaintainableParentID(node: any): commonreferences.ID {
        if (node == null) return null;
        return new commonreferences.ID(node.getAttribute("maintainableParentID"));
    }
    toNestedID(node: any): commonreferences.NestedID {
        if (node == null) return null;
        return new commonreferences.NestedID(node.getAttribute("id"));
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
        c.setNames(this.toNames(codeNode));
        c.setDescriptions(this.toDescriptions(codeNode));
        c.setId(this.toID(codeNode));
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
        var conNodes = this.searchNodeName("ConceptScheme", conceptsNode.childNodes);
        var conceptSchemes = [];
        for (var i: number = 0; i < conNodes.length; i++) {
            conceptSchemes.push(this.toConceptScheme(conNodes[i]));
        }
        concepts.setConceptSchemes(conceptSchemes);
        return concepts;
    }
    toConceptScheme(conceptSchemeNode: any) {
        if (conceptSchemeNode == null) return null;
        var cs: structure.ConceptSchemeType = new structure.ConceptSchemeType();
        cs.setNames(this.toNames(conceptSchemeNode))
        cs.setId(this.toID(conceptSchemeNode));
        cs.setAgencyId(this.toNestedNCNameID(conceptSchemeNode));
        cs.setVersion(this.toVersion(conceptSchemeNode));
        var conNodes = this.searchNodeName("Concept", conceptSchemeNode.childNodes);
        var concepts = [];
        for (var i: number = 0; i < conNodes.length; i++) {
            cs.getItems().push(this.toConcept(conNodes[i]));
        }
        return cs;
    }
    toConcept(conceptNode: any): structure.ConceptType {
        var c = new structure.ConceptType();
        c.setURN(conceptNode.getAttribute("urn"));
        c.setId(this.toID(conceptNode));
        c.setNames(this.toNames(conceptNode))
        c.setDescriptions(this.toDescriptions(conceptNode));
        return c;
    }
    toDataStructures(dsNode: any) {
        if (dsNode == null) return null;
        var dst: structure.DataStructures = new structure.DataStructures();
        var dsNodes = this.searchNodeName("DataStructure", dsNode.childNodes);
        for (var i: number = 0; i < dsNodes.length; i++) {
            dst.getDataStructures().push(this.toDataStructure(dsNodes[i]));
        }
        return dst;
    }
    toDataStructure(dsNode: any): structure.DataStructure {
        var dst: structure.DataStructure = new structure.DataStructure();
        dst.setNames(this.toNames(dsNode));
        dst.setId(this.toID(dsNode));
        dst.setVersion(this.toVersion(dsNode));
        dst.setFinal(dsNode.getAttribute("isFinal") == "true" ? true : false);
        this.currentKeyFamilyAgency = dsNode.getAttribute("agencyID");
        dst.setAgencyId(this.toNestedNCNameID(dsNode));
        dst.setVersion(this.toVersion(dsNode));

        dst.setDataStructureComponents(this.toDataStructureComponents(this.findNodeName("DataStructureComponents", dsNode.childNodes)));
        //this.recurseDomChildren(keyFamilyNode, true);
        return dst;
    }
    toDataStructureComponents(dsc: any): structure.DataStructureComponents {
        if (dsc == null) return null;
        var components: structure.DataStructureComponents = new structure.DataStructureComponents();
        var dimListNode = this.findNodeName("DimensionList", dsc.childNodes);
        var attListNode = this.findNodeName("AttributeList", dsc.childNodes);
        var measListNode = this.findNodeName("MeasureList", dsc.childNodes);
        if (dimListNode != null) {
            components.setDimensionList(this.toDimensionList(dimListNode));
        }
        if (attListNode != null) {
            components.setAttributeList(this.toAttributeList(this.searchNodeName("Attribute", attListNode.childNodes)));
        }
        if (measListNode != null) {
            components.setMeasureList(this.toMeasureList(measListNode));
        }
        return components;
    }
    toMeasureList(measListNode: any): structure.MeasureList {
        var ml: structure.MeasureList = new structure.MeasureList();
        var pm: any = this.findNodeName("PrimaryMeasure", measListNode.childNodes);
        var dim: structure.PrimaryMeasure = this.toPrimaryMeasure(pm);
        ml.setPrimaryMeasure(dim);
        return ml;
    }
    toDimensionList(dimListNode: any): structure.DimensionList {
        var dimensionList = new structure.DimensionList();
        var dimList = this.searchNodeName("Dimension", dimListNode.childNodes);
        var dimensions = [];
        for (var i: number = 0; i < dimList.length; i++) {
            if (dimList[i].nodeName.indexOf("TimeDimension") == -1) {
                var dim = this.toDimension(dimList[i]);
                dimensions.push(dim);
            }
        }
        dimensionList.setDimensions(dimensions);
        var time = this.findNodeName("TimeDimension", dimListNode.childNodes);
        dimensionList.setTimeDimension(this.toTimeDimension(time));
        var meas = this.findNodeName("MeasureDimension", dimListNode.childNodes);
        if (meas != null) {
            dimensionList.setMeasureDimension(this.toMeasureDimension(meas));
        }
        return dimensionList;
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
    toAttribute(dim: any): structure.Attribute {
        var dim2: structure.Attribute = new structure.Attribute();
        dim2.setId(this.toID(dim));
        dim2.setConceptIdentity(this.getConceptIdentity(dim));
        dim2.setLocalRepresentation(this.getLocalRepresentation(dim));
        return dim2;
    }
    toTimeDimension(dim: any): structure.TimeDimension {
        var dim2: structure.TimeDimension = new structure.TimeDimension();
        dim2.setId(this.toID(dim));
        dim2.setConceptIdentity(this.getConceptIdentity(dim));
        dim2.setLocalRepresentation(this.getLocalRepresentation(dim));
        return dim2;
    }
    toMeasureDimension(dim: any): structure.TimeDimension {
        var dim2: structure.MeasureDimension = new structure.MeasureDimension();
        dim2.setId(this.toID(dim));
        dim2.setConceptIdentity(this.getConceptIdentity(dim));
        dim2.setLocalRepresentation(this.getLocalRepresentationCrossSectional(dim));
        return dim2;
    }
    toPrimaryMeasure(dim: any): structure.PrimaryMeasure {
        var dim2: structure.PrimaryMeasure = new structure.PrimaryMeasure();
        dim2.setId(this.toID(dim));
        dim2.setConceptIdentity(this.getConceptIdentity(dim));
        dim2.setLocalRepresentation(this.getLocalRepresentation(dim));
        return dim2;
    }
    getLocalRepresentation(dim: any): structure.RepresentationType {
        var localRepNode = this.findNodeName("LocalRepresentation", dim.childNodes);
        if (localRepNode == null) {
            return new structure.RepresentationType();
        }
        var enumeration = this.findNodeName("Enumeration", localRepNode.childNodes);
        if (enumeration != null) {
            var refNode = this.findNodeName("Ref", enumeration.childNodes);
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setMaintainableParentId(this.toID(refNode));
            ref.setAgencyId(this.toNestedNCNameID(refNode));
            ref.setVersion(this.toVersion(refNode));
            ref.setRefClass(commonreferences.ObjectTypeCodelistType.CODELIST);
            ref.setPackage(commonreferences.PackageTypeCodelistType.CODELIST);
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            var rep: structure.RepresentationType = new structure.RepresentationType();
            rep.setEnumeration(reference);
        }
        return rep;
    }
    getLocalRepresentationCrossSectional(dim: any): structure.RepresentationType {
        var localRepNode = this.findNodeName("LocalRepresentation", dim.childNodes);
        if (localRepNode == null) {
            return new structure.RepresentationType();
        }
        var enumeration = this.findNodeName("Enumeration", localRepNode.childNodes);
        if (enumeration != null) {
            var refNode = this.findNodeName("Ref", enumeration.childNodes);
            var ref: commonreferences.Ref = new commonreferences.Ref();
            ref.setMaintainableParentId(this.toID(refNode));
            ref.setAgencyId(this.toNestedNCNameID(refNode));
            ref.setVersion(this.toVersion(refNode));
            ref.setRefClass(commonreferences.ObjectTypeCodelistType.CONCEPTSCHEME);
            var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
            var rep: structure.RepresentationType = new structure.RepresentationType();
            rep.setEnumeration(reference);
        }
        return rep;
    }
    getConceptIdentity(dim: any): commonreferences.Reference {
        var conceptIdentityNode = this.findNodeName("ConceptIdentity", dim.childNodes);
        var refNode = this.findNodeName("Ref", conceptIdentityNode.childNodes);
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setMaintainableParentId(this.toMaintainableParentID(refNode));
        ref.setId(this.toID(refNode));
        ref.setAgencyId(this.toNestedNCNameID(refNode));
        ref.setVersion(this.toVersion(refNode));
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        return reference;
    }
    toDimension(dim: any): structure.Dimension {
        var dim2: structure.Dimension = new structure.Dimension();
        dim2.setPosition(parseInt(dim.getAttribute("position")));
        dim2.setId(this.toID(dim));
        dim2.setConceptIdentity(this.getConceptIdentity(dim));
        dim2.setLocalRepresentation(this.getLocalRepresentation(dim));
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
