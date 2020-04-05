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
import * as _ from 'underscore';
import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as data from '../sdmx/data';
import * as config from "../sdmx/config";
//import * as sdmx from '../sdmx';
import * as time from '../sdmx/time';
import * as xml from '../sdmx/xml';
import * as collections from 'typescript-collections';
import * as Language from "../sdmx/language";
export class IdentifiableType extends common.AnnotableType {
    private id: commonreferences.ID;
    private urn: xml.anyURI;
    private uri: xml.anyURI;
    constructor() {
        super();
    }
    public getId(): commonreferences.ID {
        return this.id;
    }
    public getURN(): xml.anyURI {return this.urn;}
    public getURI(): xml.anyURI {return this.uri;}
    public setId(id: commonreferences.ID) {
        this.id = id;
    }
    public setURN(urn: xml.anyURI) {
        this.urn = urn;
    }
    public setURI(uri: xml.anyURI) {
        this.uri = uri;
    }
    public identifiesMeId(oid: commonreferences.ID): boolean {
        if (this.id.equalsID(oid)) return true;
        else return false;
    }
    public identifiesMeString(oid: string): boolean {
        if (this.id.equalsString(oid)) return true;
        else return false;
    }
    public identifiesMeNestedId(oid: commonreferences.NestedID): boolean {
        if (oid.equalsString(this.id.getString())) return true;
        else return false;
    }

}

export class NameableType extends IdentifiableType {
    private names: Array<common.Name> = [];
    private descriptions: Array<common.Description> = [];

    constructor() {
        super();
    }
    /**
     * @return the names
     */
    public getNames(): Array<common.Name> {
        return this.names;
    }

    /**
     * @param names the names to set
     */
    public setNames(names1: Array<common.Name>) {
        this.names = names1;
    }

    /**
     * @return the descriptions
     */
    public getDescriptions(): Array<common.Description> {
        return this.descriptions;
    }

    /**
     * @param descriptions the descriptions to set
     */
    public setDescriptions(descriptions: Array<common.Description>) {
        this.descriptions = descriptions;
    }

    public findName(lang: String): common.Name {
        if (this.names == null) {
            return null;
        }
        var def: common.Name = null;
        for (var i: number = 0; i < this.names.length; i++) {
            if (lang != null && lang == this.names[i].getLang()) {
                return this.names[i];
            }
            if (this.names[i].getLang() == null) {
                def = this.names[i];
            }
        }
        if (def == null && "en" != lang) {
            def = this.findName("en");
        }
        return def;
    }

    public findDescription(lang: string): common.Description {
        if (this.descriptions == null) {
            return null;
        }
        var def: common.Description = null;
        for (var i: number = 0; i < this.descriptions.length; i++) {
            if (lang != null && lang == this.descriptions[i].getLang()) {
                return this.descriptions[i];
            }
            if (this.descriptions[i].getLang() == null) {
                def = this.descriptions[i];
            }
        }
        if (def == null && "en" != lang) {
            def = this.findDescription("en");
        }
        return def;
    }

    public toString(): string {
        var loc: string = Language.Language.getLanguage();
        var name: common.Name = this.findName(loc);
        if (name != null) {
            return config.SdmxConfig.truncateName(name.toString());
        }
        var desc: common.Description = this.findDescription(loc);
        if (desc != null) {
            return config.SdmxConfig.truncateName(desc.getText());
        }
        return "NameableType";
    }

    public getName(): string {
        if (config.SdmxConfig.isSanitiseNames()) {
            return NameableType.sanitise(NameableType.toString(this));
        } else {
            return NameableType.toString(this);
        }
    }

    public static toString(named: NameableType): string {
        var loc: string = Language.Language.getLanguage();
        if (named == null) {
            //console.log("Named is null");
            return "";
        }
        if (named.findDescription == null) {
            // Obviously not a NameableType :(
            return "";
        }
        var desc: common.Description = named.findDescription(loc);
        if (desc == null) {
            var name: common.Name = named.findName(loc);
            if (name == null) {
                return named.getId().toString();
            }
            return config.SdmxConfig.truncateName(name.getText());
        }
        return config.SdmxConfig.truncateName(desc.getText());
    }

    public static toStringWithLocale(named: NameableType, loc: string): string {
        //if (concept.equals("FREQ")) {
        //    ItemType code2 = getCode();
        //    System.out.println("FREQ Code=" + code2);
        //}
        if (named == null) {
            return "";
        }
        var name: common.Name = named.findName(loc);
        if (name == null) {
            var desc: common.Description = named.findDescription(loc);
            if (desc == null) {
                return named.getId().toString();
            }
            return config.SdmxConfig.truncateName(desc.getText());
        }
        return config.SdmxConfig.truncateName(name.getText());

    }

    public static toIDString(named: NameableType): string {
        if( named instanceof NameableType ) {
           return named.getId().toString();
        }else{
           if( named!=null ){ return named}
           else{ return "";}
        }
    }

    public static sanitise(s: string): string {
        if (s.indexOf("'") != -1) {
            s = s.replace("'", "&apos;");
        }
        if (s.indexOf("\"") != -1) {
            s = s.replace("\"", "&quot;");
        }
        return s;
    }

}
export class ItemType extends NameableType {

    private parent: commonreferences.Reference = null;
    private items: Array<ItemType> = new Array<ItemType>();
    /**
     * @return the parent
     */
    public getParent(): commonreferences.Reference {
        return this.parent;
    }

    /**
     * @param parent the parent to set
     */
    public setParent(parent: commonreferences.Reference) {
        this.parent = parent;
    }

    /**
     * @return the items
     */
    public getItems(): Array<ItemType> {
        return this.items;
    }

    /**
     * @param items the items to set
     */
    public setItems(items: Array<ItemType>) {
        this.items = items;
    }

    public getItem(i: number): ItemType {
        return this.items[i];
    }

    public setItem(i: number, it: ItemType) {
        this.items[i] = it;
    }

    public removeItem(it: ItemType) {
        collections.arrays.remove(this.items, it);
    }

    public addItem(it: ItemType) {
        this.items.push(it);
    }

    public size(): number {
        return this.items.length;
    }

    public findItemString(s: string): structure.ItemType {
        for (var i: number = 0; i < this.items.length; i++) {
            if (this.items[i].identifiesMeString(s)) return this.items[i];
        }
        return null;
    }

    public findItem(id: commonreferences.ID): ItemType {
        for (var i: number = 0; i < this.items.length; i++) {
            if (this.items[i].identifiesMeId(id)) return this.items[i];
        }
        return null;
    }

}



export class VersionableType extends NameableType {
    private version: commonreferences.Version = commonreferences.Version.ONE;
    private validFrom: xml.DateTime = null;;
    private validTo: xml.DateTime = null;

    constructor() {
        super();
    }

    getVersion(): commonreferences.Version {
        return this.version;
    }

    /**
     * @param version the version to set
     */
    setVersion(version: commonreferences.Version) {
        this.version = version;
    }
    getValidFrom(): xml.DateTime {
        return this.validFrom;
    }

    setValidFrom(validFrom: xml.DateTime) {
        this.validFrom = validFrom;
    }

    public getValidTo(): xml.DateTime {
        return this.validTo;
    }
    setValidTo(validTo: xml.DateTime) {
        this.validTo = validTo;
    }

}
export class MaintainableType extends VersionableType {
    private agencyId: commonreferences.NestedNCNameID = null;
    private isfinal: boolean = null;
    private isexternalReference: boolean = null;
    private externalReferences: common.ExternalReferenceAttributeGroup = null;

    /**
     * @return the agencyID
     */
    public getAgencyId(): commonreferences.NestedNCNameID {
        return this.agencyId;
    }

    setAgencyId(agencyID: commonreferences.NestedNCNameID) {
        this.agencyId = agencyID;
    }

    isFinal(): boolean {
        return this.isfinal;
    }

    setFinal(isFinal: boolean) {
        this.isfinal = isFinal;
    }

    isExternalReference(): boolean {
        return this.isexternalReference;
    }

    setExternalReference(isExternalReference: boolean) {
        this.isexternalReference = isExternalReference;
    }

    public getExternalReferences(): common.ExternalReferenceAttributeGroup {
        return this.externalReferences;
    }

    setExternalReferences(externalReferences: common.ExternalReferenceAttributeGroup) {
        this.externalReferences = externalReferences;
    }

    identifiesMeStrings(agency2: string, id2: string, vers2: string): boolean {
        return this.identifiesMe(new commonreferences.NestedNCNameID(agency2), new commonreferences.ID(id2), new commonreferences.Version(vers2));
    }

    identifiesMe(agency2: commonreferences.NestedNCNameID, id2: commonreferences.NestedID, vers2: commonreferences.Version): boolean {
        /*
         * I honestly dont know why i always end up in this function debugging...
         * next time i look here.. check in the parser api that the objects are being created properly 
         * :D
         * JG
         */
        //System.out.println("Left=" + this.agencyID + "." + this.getId() + "." + this.getVersion());
        //System.out.println("Right=" + agency2 + "." + id2 + "." + vers2);
        //console.log("myAg:" + this.getAgencyId().toString() + " compare:" + agency2.toString());
        //console.log(this.getId().toString());
        //console.log("myId:" + this.getId().toString() + " compare:" + id2.toString());
        //if (this.getVersion()!=null&&vers2!=null){
        //console.log("myv:" + this.getVersion() + " compare:" + vers2.toString());
        //}

        if (vers2 == null || this.getVersion() == null) {
            if (this.agencyId.equalsNestedNCNameID(agency2) && this.getId().equalsNestedID(id2)) {
                //console.log("Identifies me1");
                return true;
            } else {
                //console.log("Doesn't Identify me2");
                //System.out.println("Doesn't Match!!");
                return false;
            }
        } else {
            if (this.agencyId.equalsNestedNCNameID(agency2) && this.getId().equalsNestedID(id2) && this.getVersion().equalsVersion(vers2)) {
                //console.log("Identifies me3");
                return true;
            } else {
                //console.log("Doesn't Identify me4");
                return false;
            }
        }
    }
    identifiesMeURI(uri: xml.anyURI): boolean {
        var ref: commonreferences.Reference = new commonreferences.Reference(null, uri);
        return this.identifiesMe(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getVersion());
    }

    asReference(): commonreferences.Reference {
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setAgencyId(this.agencyId);
        ref.setMaintainableParentId(this.getId());
        ref.setMaintainableParentVersion(this.getVersion());
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, this.getURI());
        return reference;
    }
}
export class ItemSchemeType extends MaintainableType {
    private items: Array<ItemType> = new Array<ItemType>();
    private partial: boolean = false;

    constructor() {
        super();

    }

    /**
     * @return the items
     */
    public getItems(): Array<ItemType> {
        return this.items;
    }

    /**
     * @param items the items to set
     */
    public setItems(itms: Array<ItemType>) {
        this.items = itms;
    }

    /**
     * @return the partial
     */
    public isPartial(): boolean {
        return this.partial;
    }

    /**
     * @param partial the partial to set
     */
    public setPartial(partial: boolean) {
        this.partial = partial;
    }

    public getItem(i: number): ItemType {
        return this.items[i];
    }

    public setItem(i: number, it: ItemType) {
        this.items[i] = it;
    }

    public removeItem(it: ItemType) {
        this.items.splice(this.items.indexOf(it), 1);
    }

    public addItem(it: ItemType) {
        this.items.push(it);
    }

    public size(): number {
        return this.items.length;
    }

    public findItemString(s: string): ItemType {
        for (var i: number = 0; i < this.items.length; i++) {
            if (this.items[i].identifiesMeString(s)) return this.items[i];
        }
        return null;
    }

    public findItemId(s: commonreferences.ID): ItemType {
        for (var i: number = 0; i < this.items.length; i++) {
            if (this.items[i].identifiesMeId(s)) return this.items[i];
        }
        return null;
    }

    public findItemNestedId(s: commonreferences.NestedID): ItemType {
        for (var i: number = 0; i < this.items.length; i++) {
            if (this.items[i].identifiesMeNestedId(s)) return this.items[i];
        }
        return null;
    }
    public findSubItemsString(s: string): Array<ItemType> {
        if( s == null ) {
            return this.findSubItemsId(null);
        }
        return this.findSubItemsId(new commonreferences.ID(s));
    }

    public findSubItemsId(id: commonreferences.ID): Array<ItemType> {
        var result: Array<ItemType> = new Array<ItemType>();
        if (id == null) {
            for (var i: number = 0; i < this.items.length; i++) {
                var item: ItemType = this.items[i];
                if (item.getParent() == null) {
                    result.push(item);
                }
            }
            return result;
        } else {
            for (var i: number = 0; i < this.items.length; i++) {
                var item: ItemType = this.items[i];
                if (item.getParent() != null && item.getParent().getId() != null && item.getParent().getId().equalsID(id)) {
                    result.push(item);
                }
            }
            return result;
        }
    }
    public isFlat() {
        for (var i: number = 0; i < this.size(); i++) {
            if (this.items[i].getParent() != null && this.items[i].getParent().getId() != null) {
                return false;
            }else{
                //console.log(this.items[i].getParent());
            }
        }
        return true;

    }
    public getLevel(s:string):number {
        if( s == null ) return 0;
        var id:commonreferences.ID = new commonreferences.ID(s);
        var itm: structure.ItemType = this.findItemId(id);
        var i:number = 1;
        for (; i < 30 && itm.getParent()!=null;i++) {
            itm = this.findItemString(itm.getParent().getId().toString());
        }
        return i;
    }
    public getItemsOnLevel(n:number):Array<ItemType> {
        var result = [];
        for (var i: number = 0; i < this.size();i++) {
            if (this.getLevel(this.items[i].getId().toString())==n){
                result.push(this.items[i]);
            }
        }
        return result;
    }
    public getMaximumLevel():number {
        var max = 0;
        for (var i: number = 0; i < this.size();i++) {
            if (this.getLevel(this.items[i].getId().toString())>max){
                max = this.getLevel(this.items[i].getId().toString());
            }
        }
        return max;
    }
}

export class CodeType extends ItemType {

}
export class Codelist extends ItemSchemeType {
    constructor() {
        super();
    }


}
export class ConceptSchemeType extends ItemSchemeType {

}
export class ConceptType extends ItemType {

}
export class StructureUsageType extends MaintainableType {
    private structure: commonreferences.Reference = null;

    constructor() {
        super();
    }

    public getStructure(): commonreferences.Reference {
        return this.structure;
    }
    public setStructure(struct: commonreferences.Reference) {
        this.structure = struct;

    }
}

export class Dataflow extends StructureUsageType {
    constructor() {
        super();
    }
    public asReference() {
        var ref: commonreferences.Ref = new commonreferences.Ref();
        ref.setAgencyId(this.getAgencyId());
        ref.setId(this.getId());
        ref.setVersion(this.getVersion());
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        return reference;
    }
}
export class DataflowList {
    private dataflowList: Array<Dataflow> = [];
    public getDataflowList() {
        return this.dataflowList;
    }
    public setDataflowList(dl: Array<Dataflow>) {
        this.dataflowList = dl;

    }
    public findDataflow(ref: commonreferences.Reference): Dataflow {
        for (var i: number = 0; i < this.dataflowList.length; i++) {
            if (this.dataflowList[i].identifiesMe(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getMaintainedParentVersion())) {
                return this.dataflowList[i];
            }
        }
        return null;
    }
}
export class Component extends IdentifiableType {
    private conceptIdentity: commonreferences.Reference = null;
    private localRepresentation: RepresentationType = null;

    public getId(): commonreferences.ID {
        if (super.getId() == null) {
            if (this.conceptIdentity == null) {
                //alert("Concept Identity Null:LocalRep:" + JSON.stringify(this.localRepresentation));
                //Thread.dumpStack();
                return new commonreferences.ID("MISS");
            }
            return this.conceptIdentity.getId().asID();
        }
        return super.getId();
    }
    constructor() {
        super();
    }
    public getConceptIdentity() {
        return this.conceptIdentity;
    }
    public setConceptIdentity(ci: commonreferences.Reference) {
        this.conceptIdentity = ci;
    }
    public getLocalRepresentation() {
        return this.localRepresentation;
    }
    public setLocalRepresentation(lr: RepresentationType) {
        this.localRepresentation = lr;
    }
}
export class ComponentUtil {
    public static getRepresentation(reg: interfaces.LocalRegistry, c: Component): RepresentationType {
        var rep: RepresentationType = c.getLocalRepresentation();
        if (rep == null) {
            var concept: ConceptType = reg.findConcept(c.getConceptIdentity());
            //return concept.getCoreRepresentation();
            return null;
        }
        return c.getLocalRepresentation();
    }
    public static getLocalRepresentation(c: Component): RepresentationType {
        if (c == null) return null;
        return c.getLocalRepresentation();
    }
}
export class Dimension extends Component {
    private position: number = 0;
    public getPosition() {
        return this.position;
    }
    public setPosition(i: number) {
        this.position = i;
    }
}
export class TimeDimension extends Component {

}
export class MeasureDimension extends Component {

}

export class Attribute extends Component {

}
export class PrimaryMeasure extends Component {

}
export class DimensionList {
    private dimensions: Array<Dimension> = [];
    private timeDimension: TimeDimension = null;
    private measureDimension: MeasureDimension = null;
    public getDimensions(): Array<Dimension> {return this.dimensions;}
    public setDimensions(dims: Array<Dimension>) {
        this.dimensions = dims;
    }
    public getMeasureDimension(): MeasureDimension {return this.measureDimension;}
    public setMeasureDimension(md: MeasureDimension) {
        this.measureDimension = md;
    }
    public getTimeDimension(): TimeDimension {
        return this.timeDimension;
    }
    public setTimeDimension(td: TimeDimension) {
        this.timeDimension = td;
    }

}
export class AttributeList {
    private attributes: Array<Attribute> = [];
    public getAttributes(): Array<Attribute> {return this.attributes;}
    public setAttributes(at: Array<Attribute>) {
        this.attributes = at;
    }
}
export class MeasureList {
    private primaryMeasure: PrimaryMeasure = null;
    public getPrimaryMeasure(): PrimaryMeasure {return this.primaryMeasure;}
    public setPrimaryMeasure(pm: PrimaryMeasure) {this.primaryMeasure = pm;}

}
export class DataStructureComponents {
    private dimensionList: DimensionList = new DimensionList();
    private measureList: MeasureList = new MeasureList();
    private attributeList: AttributeList = new AttributeList();
    public getDimensionList(): DimensionList {
        return this.dimensionList;
    }
    public setDimensionList(dl: DimensionList) {
        this.dimensionList = dl;
    }
    public getMeasureList(): MeasureList {
        return this.measureList;
    }
    public setMeasureList(ml: MeasureList) {
        this.measureList = ml;
    }
    public getAttributeList(): AttributeList {
        return this.attributeList;
    }
    public setAttributeList(al: AttributeList) {
        this.attributeList = al;
    }
}
export class DataStructure extends MaintainableType {

    private components: DataStructureComponents = null;

    public getDataStructureComponents(): DataStructureComponents {
        return this.components;
    }

    public setDataStructureComponents(components: DataStructureComponents) {
        this.components = components;
    }

    public dump() {
        for (var i: number = 0; i < this.components.getDimensionList().getDimensions().length; i++) {
            var dim1: Dimension = this.components.getDimensionList().getDimensions()[i];
            console.log("Dim:" + i + ":" + dim.getId() + ": ci ref:agency" + dim.getConceptIdentity().getAgencyId() + ":mid" + dim1.getConceptIdentity().getMaintainableParentId() + +"id:" + dim1.getConceptIdentity().getId() + ":v:" + dim1.getConceptIdentity().getVersion());
            if (dim1.getLocalRepresentation().getEnumeration() != null) {
                console.log("Dim:" + i + "enum ref:agency" + dim1.getLocalRepresentation().getEnumeration().getAgencyId() + ":mid" + dim1.getLocalRepresentation().getEnumeration().getMaintainableParentId() + ":" + dim1.getLocalRepresentation().getEnumeration().getId() + ":v:" + dim1.getLocalRepresentation().getEnumeration().getVersion());
            }
        }
        var dim: Component = this.components.getDimensionList().getMeasureDimension();
        if (dim != null) {
            console.log("Dim:measure:" + dim.getId() + ": ci ref:agency" + dim.getConceptIdentity().getAgencyId() + ":mid" + dim.getConceptIdentity().getMaintainableParentId() + "id:" + dim.getConceptIdentity().getId() + ":v:" + dim.getConceptIdentity().getVersion());
            if (dim.getLocalRepresentation().getEnumeration() != null) {
                console.log("Dim:" + "pm" + "enum ref:agency" + dim.getLocalRepresentation().getEnumeration().getAgencyId() + ":mid" + dim.getLocalRepresentation().getEnumeration().getMaintainableParentId() + ":" + dim.getLocalRepresentation().getEnumeration().getId() + ":v:" + dim.getLocalRepresentation().getEnumeration().getVersion());
            }
        }
        var dim: Component = this.components.getDimensionList().getTimeDimension();
        if (dim != null) {
            console.log("Dim:time:" + dim.getId() + ": ci ref:agency" + dim.getConceptIdentity().getAgencyId() + ":mid" + dim.getConceptIdentity().getMaintainableParentId() + "id:" + dim.getConceptIdentity().getId() + ":v:" + dim.getConceptIdentity().getVersion());
            if (dim.getLocalRepresentation().getEnumeration() != null) {
                console.log("Dim:" + "time" + "enum ref:agency" + dim.getLocalRepresentation().getEnumeration().getAgencyId() + ":mid" + dim.getLocalRepresentation().getEnumeration().getMaintainableParentId() + ":" + dim.getLocalRepresentation().getEnumeration().getId() + ":v:" + dim.getLocalRepresentation().getEnumeration().getVersion());
            }
        }
        var dim: Component = this.components.getMeasureList().getPrimaryMeasure();
        if (dim != null) {
            console.log("Dim:pm:" + dim.getId() + ": ci ref:agency" + dim.getConceptIdentity().getAgencyId() + ":mid" + dim.getConceptIdentity().getMaintainableParentId() + "id:" + dim.getConceptIdentity().getId() + ":v:" + dim.getConceptIdentity().getVersion());
            if (dim.getLocalRepresentation().getEnumeration() != null) {
                console.log("Dim:" + "pm" + "enum ref:agency" + dim.getLocalRepresentation().getEnumeration().getAgencyId() + ":mid" + dim.getLocalRepresentation().getEnumeration().getMaintainableParentId() + ":" + dim.getLocalRepresentation().getEnumeration().getId() + ":v:" + dim.getLocalRepresentation().getEnumeration().getVersion());
            }
        }
        for (var i: number = 0; i < this.components.getAttributeList().getAttributes().length; i++) {
            var dim: Component = this.components.getAttributeList().getAttributes()[i];
            console.log("Att:" + i + ":" + dim.getId() + ": ci ref:agency" + dim.getConceptIdentity().getAgencyId() + ":mid" + dim.getConceptIdentity().getMaintainableParentId() + "id:" + dim.getConceptIdentity().getId() + ":v:" + dim.getConceptIdentity().getVersion());
            if (dim.getLocalRepresentation().getEnumeration() != null) {
                console.log("Att:" + i + "enum ref:agency" + dim.getLocalRepresentation().getEnumeration().getAgencyId() + ":mid" + dim.getLocalRepresentation().getEnumeration().getMaintainableParentId() + ":" + dim.getLocalRepresentation().getEnumeration().getId() + ":v:" + dim.getLocalRepresentation().getEnumeration().getVersion());
            }
        }
    }

    public findComponentString(col: string): Component {
        return this.findComponent(new commonreferences.ID(col));
    }

    public findComponent(col: commonreferences.ID): Component {
        for (var i: number = 0; i < this.components.getDimensionList().getDimensions().length; i++) {
            var dim = this.components.getDimensionList().getDimensions()[i];
            if (dim.getId().equalsID(col)) {
                return dim;
            }
        }
        for (var i: number = 0; i < this.components.getAttributeList().getAttributes().length; i++) {
            var dim2 = this.components.getAttributeList().getAttributes()[i];
            if (dim2.getId().equalsID(col)) {
                return dim2;
            }
        }
        if (this.components.getDimensionList().getMeasureDimension() != null) {
            var dim3 = this.components.getDimensionList().getMeasureDimension();
            if (dim3.getId().equalsID(col)) {
                return dim3;
            }
        }
        var time: TimeDimension = this.components.getDimensionList().getTimeDimension();
        if (time!=null&&time.getId().equalsID(col)) {
            return time;
        }
        var dim2: PrimaryMeasure = this.components.getMeasureList().getPrimaryMeasure();
        if (dim2.getId().equalsID(col)) {
            return dim2;
        }
        if ("OBS_VALUE" == col.getString()) {
            return dim2;
        }
        return null;
    }

    public asReference(): commonreferences.Reference {
        var ref: commonreferences.Ref = new commonreferences.Ref()
        ref.setAgencyId(this.getAgencyId());
        ref.setMaintainableParentId(this.getId());
        ref.setVersion(this.getVersion());
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        return reference;
    }

    public asDataflow(): Dataflow {
        var dataFlow: Dataflow = new Dataflow();
        dataFlow.setNames(this.getNames());
        dataFlow.setDescriptions(this.getDescriptions());
        dataFlow.setStructure(this.asReference());
        dataFlow.setAnnotations(this.getAnnotations());
        dataFlow.setAgencyId(this.getAgencyId());
        dataFlow.setId(this.getId());
        dataFlow.setVersion(this.getVersion());
        return dataFlow;
    }
    public isDimension(s: string): boolean {
        for (var i: number = 0; i < this.getDataStructureComponents().getDimensionList().getDimensions().length; i++) {
            var d: Dimension = this.getDataStructureComponents().getDimensionList().getDimensions()[i];
            if (s == d.getId().toString()) {
                return true;
            }
        }
        if (s == this.getDataStructureComponents().getDimensionList().getTimeDimension().getId().toString()) {
            return true;
        }
        return false;
    }
    public isTimeDimension(s: string): boolean {
        if (s == this.getDataStructureComponents().getDimensionList().getTimeDimension().getId().toString()) {
            return true;
        }
        return false;
    }
    public isAttribute(s: String): boolean {
        for (var i: number = 0; i < this.getDataStructureComponents().getAttributeList().getAttributes().length; i++) {
            if (s == this.getDataStructureComponents().getAttributeList().getAttributes()[i].getId().toString()) {
                return true;
            }
        }
        return false;
    }
    public isPrimaryMeasure(s: string): boolean {
        if ("OBS_VALUE" == s) {return true;}
        if (this.getDataStructureComponents().getMeasureList().getPrimaryMeasure().getId().toString() == s) {return true;}
        return false;
    }
    public getKeyPosition(s: string): number {
        var i: number = 0;
        for (var j: number = 0; j < this.getDataStructureComponents().getDimensionList().getDimensions().length; i++) {
            if (this.getDataStructureComponents().getDimensionList().getDimensions()[i].getId().equalsString(s)) {
                return i;
            }
            i++;
        }
        if (s == this.getDataStructureComponents().getDimensionList().getTimeDimension().getId().toString()) {
            return i;
        }
        throw new Error("Dimension " + s + " not found in DataStructure:" + this.getId().toString());
    }
}

export class CodeLists {
    private codelists: Array<Codelist> = [];


    constructor() {

    }

    /**
     * @return the codelists
     */
    getCodelists(): Array<Codelist> {
        return this.codelists;
    }

    /**
     * @param codelists the codelists to set
     */
    setCodelists(cls: Array<Codelist>) {
        this.codelists = cls;
    }
    findCodelistStrings(agency: string, id: string, vers: string): Codelist {
        var findid: commonreferences.ID = new commonreferences.ID(id);
        var ag: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(agency);
        var ver: commonreferences.Version = vers == null ? null : new commonreferences.Version(vers);
        return this.findCodelist(ag, findid, ver);
    }
    findCodelist(agency2: commonreferences.NestedNCNameID, findid: commonreferences.NestedID, ver: commonreferences.Version): Codelist {
        for (var i: number = 0; i < this.codelists.length; i++) {
            var cl2: Codelist = this.codelists[i];
            if (cl2.identifiesMe(agency2, findid, ver)) {
                return cl2;
            }
        }
        return null;
    }
    findCodelistURI(uri: xml.anyURI): Codelist {
        for (var i: number = 0; i < this.codelists.length; i++) {
            if (this.codelists[i].identifiesMeURI(uri)) {
                return this.codelists[i];
            }
        }
        return null;
    }
    /*
     * This method is used in sdmx 2.0 parsing to find a codelist with the correct ID..
     * this is because the Dimension in the KeyFamily does not contain a complete reference
     * only an ID.. we lookup the Codelist by it's ID, when we find a match, we can make a 
     * LocalItemSchemeReference out of it with it's AgencyID and Version.
     */
    findCodelistById(id: commonreferences.NestedID): Codelist {
        var cl: Codelist = null;
        for (var i: number = 0; i < this.codelists.length; i++) {
            if (this.codelists[i].identifiesMeId(id.asID())) {
                if (cl == null) cl = this.codelists[i];
                else {
                    var j: number = cl.getVersion().compareTo(this.codelists[i].getVersion());
                    switch (j) {
                        case -1: // Less
                            break;
                        case 0:  // Equal
                            break;
                        case 1:
                            // Our found conceptscheme has a greater version number.
                            cl = this.codelists[i];
                            break;
                    }
                }
            }
        }
        return cl;
    }
    findCodelistReference(ref: commonreferences.Reference): Codelist {
        return this.findCodelist(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getVersion());
    }

    merge(codelists: CodeLists) {
        if (codelists == null) return;
        for (var i: number = 0; i < codelists.getCodelists().length; i++) {
            this.codelists.push(codelists[i]);
        }
    }
}
export class Concepts {
    private concepts: Array<ConceptSchemeType> = [];


    constructor() {

    }

    /**
     * @return the codelists
     */
    getConceptSchemes(): Array<ConceptSchemeType> {
        return this.concepts;
    }

    /**
     * @param codelists the codelists to set
     */
    setConceptSchemes(cls: Array<ConceptSchemeType>) {
        this.concepts = cls;
    }
    findConceptSchemeStrings(agency: string, id: string, vers: string): ConceptSchemeType {
        var findid: commonreferences.ID = new commonreferences.ID(id);
        var ag: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(agency);
        var ver: commonreferences.Version = vers == null ? null : new commonreferences.Version(vers);
        return this.findConceptScheme(ag, findid, ver);
    }
    findConceptScheme(agency2: commonreferences.NestedNCNameID, findid: commonreferences.NestedID, ver: commonreferences.Version): ConceptSchemeType {
        for (var i: number = 0; i < this.concepts.length; i++) {
            var cl2: ConceptSchemeType = this.concepts[i];
            if (cl2.identifiesMe(agency2, findid, ver)) {
                return cl2;
            }
        }
        return null;
    }
    findConceptSchemeURI(uri: xml.anyURI): ConceptSchemeType {
        for (var i: number = 0; i < this.concepts.length; i++) {
            if (this.concepts[i].identifiesMeURI(uri)) {
                return this.concepts[i];
            }
        }
        return null;
    }
    /*
     * This method is used in sdmx 2.0 parsing to find a codelist with the correct ID..
     * this is because the Dimension in the KeyFamily does not contain a complete reference
     * only an ID.. we lookup the Codelist by it's ID, when we find a match, we can make a 
     * LocalItemSchemeReference out of it with it's AgencyID and Version.
     */
    findConceptSchemeById(id: commonreferences.NestedID): ConceptSchemeType {
        var cl: ConceptSchemeType = null;
        for (var i: number = 0; i < this.concepts.length; i++) {
            if (this.concepts[i].identifiesMeId(id.asID())) {
                if (cl == null) cl = this.concepts[i];
                else {
                    var j: number = cl.getVersion().compareTo(this.concepts[i].getVersion());
                    switch (j) {
                        case -1: // Less
                            break;
                        case 0:  // Equal
                            break;
                        case 1:
                            // Our found conceptscheme has a greater version number.
                            cl = this.concepts[i];
                            break;
                    }
                }
            }
        }
        return cl;
    }
    findConceptSchemeReference(ref: commonreferences.Reference): ConceptSchemeType {
        if (ref == null) {return null;}
        else {
            var cs: ConceptSchemeType = this.findConceptScheme(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getVersion());
            if (cs == null) {return null;}
            return cs;
        }
    }

    merge(conceptsType: Concepts) {
        if (conceptsType == null) {return;}
        for (var i: number = 0; i < conceptsType.getConceptSchemes().length; i++) {
            this.concepts.push(conceptsType.getConceptSchemes()[i]);
        }
    }
}
export class DataStructures {
    private datastructures: Array<DataStructure> = [];


    constructor() {

    }

    /**
     * @return the codelists
     */
    getDataStructures(): Array<DataStructure> {
        return this.datastructures;
    }

    /**
     * @param codelists the codelists to set
     */
    setDataStructures(cls: Array<DataStructure>) {
        this.datastructures = cls;
    }
    findDataStructureStrings(agency: string, id: string, vers: string): DataStructure {
        var findid: commonreferences.ID = new commonreferences.ID(id);
        var ag: commonreferences.NestedNCNameID = new commonreferences.NestedNCNameID(agency);
        var ver: commonreferences.Version = vers == null ? null : new commonreferences.Version(vers);
        return this.findDataStructure(ag, findid, ver);
    }
    findDataStructure(agency2: commonreferences.NestedNCNameID, findid: commonreferences.NestedID, ver: commonreferences.Version): DataStructure {
        for (var i: number = 0; i < this.datastructures.length; i++) {
            var cl2: DataStructure = this.datastructures[i];
            if (cl2.identifiesMe(agency2, findid, ver)) {
                return cl2;
            }
        }
        return null;
    }
    findDataStructureURI(uri: xml.anyURI): DataStructure {
        for (var i: number = 0; i < this.datastructures.length; i++) {
            if (this.datastructures[i].identifiesMeURI(uri)) {
                return this.datastructures[i];
            }
        }
        return null;
    }
    findDataStructureReference(ref: commonreferences.Reference): DataStructure {
        return this.findDataStructure(ref.getAgencyId(), ref.getMaintainableParentId(), ref.getMaintainedParentVersion());
    }

    merge(dss: DataStructures) {
        if (dss == null) return;
        for (var i: number = 0; i < dss.getDataStructures().length; i++) {
            this.datastructures.push(dss.getDataStructures()[i]);
        }
    }
}

export class Structures implements interfaces.LocalRegistry {
    private codelists: CodeLists = null;
    private concepts: Concepts = null;
    private datastructures: DataStructures = null;
    private dataflows: DataflowList = null;
    getConcepts() {
        return this.concepts;
    }
    setConcepts(c: Concepts) {
        this.concepts = c;
    }
    getCodeLists() {
        return this.codelists;
    }
    setCodeLists(c: CodeLists) {
        this.codelists = c;
    }
    getDataStructures() {
        return this.datastructures;
    }
    setDataStructures(ds: DataStructures) {
        this.datastructures = ds;
    }
    setDataflows(dl: DataflowList) {
        this.dataflows = dl;
    }
    getDataflows(): DataflowList {
        return this.dataflows;
    }
    // Registry
    listDataflows(): Array<structure.Dataflow> {
        if (this.dataflows == null) {return [];}
        return this.dataflows.getDataflowList();
    }
    clear(): void {

    }
    load(struct: message.StructureType): void {

    }
    unload(struct: message.StructureType): void {

    }
    findDataStructure(ref: commonreferences.Reference): structure.DataStructure {
        if (this.datastructures == null) return null;
        return this.datastructures.findDataStructureReference(ref);
    }
    findDataflow(ref: commonreferences.Reference): structure.Dataflow {
        if (this.dataflows == null) return null;
        return this.dataflows.findDataflow(ref);
    }
    findCode(ref: commonreferences.Reference): structure.CodeType {
        if (this.codelists == null) return null;
        return this.codelists.findCodelistReference(ref).findItemId(ref.getId().asID());
    }
    findCodelist(ref: commonreferences.Reference): structure.Codelist {
        if (this.codelists == null) return null;
        return this.codelists.findCodelistReference(ref);
    }
    findItemType(item: commonreferences.Reference): structure.ItemType {
        return null;
    }
    findConcept(ref: commonreferences.Reference): structure.ConceptType {
        if (this.concepts == null) {return null;}
        var cs: ConceptSchemeType = this.concepts.findConceptSchemeReference(ref);
        if (cs == null) {return null;}
        return cs.findItemId(ref.getId().asID());
    }
    findConceptScheme(ref: commonreferences.Reference): structure.ConceptSchemeType {
        if (this.concepts == null) {return null;}
        return this.concepts.findConceptSchemeReference(ref);
    }
    searchDataStructure(ref: commonreferences.Reference): Array<structure.DataStructure> {
        return [];
    }
    searchDataflow(ref: commonreferences.Reference): Array<structure.Dataflow> {
        return [];
    }
    searchCodelist(ref: commonreferences.Reference): Array<structure.Codelist> {
        return [];
    }
    searchItemType(item: commonreferences.Reference): Array<structure.ItemType> {
        return [];
    }
    searchConcept(ref: commonreferences.Reference): Array<structure.ConceptType> {
        return [];
    }
    searchConceptScheme(ref: commonreferences.Reference): Array<structure.ConceptSchemeType> {
        return [];
    }
    save(): any {

    }
}
export class TextFormatType {
    private textType: common.DataType = null;
    private isSequence: boolean = null;
    private interval: number = null;
    private startValue: number = null;
    private endValue: number = null;
    private timeInterval: xml.duration = null;
    private startTime: common.StandardTimePeriodType = null;
    private endTime: common.StandardTimePeriodType = null;
    private minLength: number = null;
    private maxLength: number = null;
    private minValue: number = null;
    private maxValue: number = null;
    private decimals: number = null;
    private pattern: string = null;
    private isMultiLingual: boolean = null;
    constructor() {

    }
    public getTextType(): common.DataType {
        return this.textType;
    }
    public getIsSequence(): boolean {
        return this.isSequence;
    }
    public getInterval(): number {
        return this.interval;
    }
    public getStartValue(): number {
        return this.startValue;
    }
    public getEndValue(): number {
        return this.endValue;
    }
    public getTimeInterval(): xml.duration {
        return this.timeInterval;
    }
    public getStartTime(): common.StandardTimePeriodType {
        return this.startTime;
    }
    public getEndTime(): common.StandardTimePeriodType {
        return this.endTime;
    }
    public getMinLength(): number {
        return this.minLength;
    }
    public getMaxLength(): number {
        return this.maxLength;
    }
    public getDecimals(): number {
        return this.decimals;
    }
    public getPattern(): string {
        return this.pattern;
    }
    public getIsMultilingual(): boolean {
        return this.isMultiLingual;
    }
    public setTextType(t: common.DataType) {
        this.textType = t;
    }
    public setIsSequence(b: boolean) {
        this.isSequence = b;
    }
    public setInterval(n: number) {
        this.interval = n;
    }
    public setStartValue(n: number) {
        this.startValue = n;
    }
    public setEndValue(n: number) {
        this.endValue = n;
    }
    public setTimeInterval(d: xml.duration) {
        this.timeInterval = d;
    }
    public setStartTime(t: common.StandardTimePeriodType) {
        this.startTime = t;
    }
    public setEndTime(t: common.StandardTimePeriodType) {
        this.endTime = t;
    }
    public setMinLength(n: number) {
        this.minLength = n;
    }
    public setMaxLength(n: number) {
        this.maxLength = n;
    }
    public setDecimals(n: number) {
        this.decimals = n;
    }
    public setPattern(s: string) {
        this.pattern = s;
    }
    public setIsMultilingual(b: boolean) {
        this.isMultiLingual = b;
    }
}
export class BasicComponentTextFormatType extends TextFormatType {}
export class SimpleComponentTextFormatType extends BasicComponentTextFormatType {}
export class CodededTextFormatType extends SimpleComponentTextFormatType {}
export class RepresentationType {

    private textFormat: TextFormatType = null;
    private enumeration: commonreferences.Reference = null;
    private enumerationFormat: CodededTextFormatType = null;

    constructor() {}

    /**
     * @return the textFormat
     */
    public getTextFormat(): TextFormatType {
        return this.textFormat;
    }

    /**
     * @param textFormat the textFormat to set
     */
    public setTextFormat(textFormat: TextFormatType) {
        this.textFormat = textFormat;
    }

    /**
     * @return the enumeration
     */
    public getEnumeration(): commonreferences.Reference {
        return this.enumeration;
    }

    /**
     * @param enumeration the enumeration to set
     */
    public setEnumeration(enumeration: commonreferences.Reference) {
        this.enumeration = enumeration;
    }

    /**
     * @return the enumerationForma
     */
    public getEnumerationFormat(): CodededTextFormatType {
        return this.enumerationFormat;
    }

    /**
     * @param enumerationForma the enumerationForma to set
     */
    public setEnumerationFormat(enumerationForma: CodededTextFormatType) {
        this.enumerationFormat = enumerationForma;
    }
}

export default {
    Attribute:Attribute,
    AttributeList:AttributeList,
    BasicComponentTextFormatType: BasicComponentTextFormatType,
    CodeLists:CodeLists,
    CodeType:CodeType,
    CodededTextFormatType:CodededTextFormatType,
    Codelist:Codelist,
    Component:Component,
    ComponentUtil:ComponentUtil,
    ConceptSchemeType:ConceptSchemeType,
    ConceptType:ConceptType,
    Concepts:Concepts,
    DataStructure:DataStructure,
    DataStructureComponents:DataStructureComponents,
    DataStructures:DataStructures,
    Dataflow:Dataflow,
    DataflowList:DataflowList,
    Dimension:Dimension,
    DimensionList:DimensionList,
    IdentifiableType:IdentifiableType,
    ItemSchemeType:ItemSchemeType,
    ItemType:ItemType,
    MaintainableType:MaintainableType,
    PrimaryMeasure:PrimaryMeasure,
    RepresentationType:RepresentationType,
    SimpleComponentTextFormatType:SimpleComponentTextFormatType,
    StructureUsageType:StructureUsageType,
    Structures:Structures,
    TextFormatType:TextFormatType,
    TimeDimension:TimeDimension,
    VersionableType:VersionableType
    }