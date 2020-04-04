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
import * as collections from 'typescript-collections';
import moment from "moment";
import * as interfaces from '../sdmx/interfaces';
import * as registry from '../sdmx/registry';
import * as structure from '../sdmx/structure';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as common from '../sdmx/common';
import * as sdmx from '../sdmx';
import * as timepack from '../sdmx/time';
import * as _ from 'lodash';
export class Query {
    private flow: structure.Dataflow = null;
    private structRef: commonreferences.Reference = null;
    private registry: interfaces.LocalRegistry = null;
    private query: Array<QueryKey> = [];
    private startDate: Date = new Date();
    private endDate: Date = new Date();
    private timeQueryKey: QueryKey = null;
    private updatedAfter: Date = null;
    private firstNObservations: number = null;
    private lastNObservations: number = null;
    private dimensionAtObservation: string = null;
    private detail: string = null;
    private includeHistory: boolean = null;
    private providerRef: string = null;

    constructor(flow: structure.Dataflow, registry: interfaces.LocalRegistry) {
        this.flow = flow;
        this.structRef = flow.getStructure();
        this.registry = registry;
        var kns = this.getKeyNames();
        for (var i: number = 0; i < kns.length; i++) {
            this.query.push(new QueryKey(this.structRef, registry, kns[i]));
        }
        this.startDate.setFullYear(2000);
        this.endDate.setFullYear(2016);
        if (this.getTimeKeyName() != null) {
            this.timeQueryKey = new QueryKey(flow.getStructure(), registry, this.getTimeKeyName());
        }
    }
    public getQueryKey(id: string):QueryKey {
        for (var i: number = 0; i < this.query.length; i++) {
            if (this.query[i].getName() == id) return this.query[i];
        }
        if (this.timeQueryKey.getName() == id) {
            return this.timeQueryKey;
        }
        return null;
    }
    public getKeyNames(): Array<string> {
        var struct: structure.DataStructure = this.registry.findDataStructure(this.structRef);
        var keynames = [];
        for (var i: number = 0; i < struct.getDataStructureComponents().getDimensionList().getDimensions().length; i++) {
            var dim1: structure.Dimension = struct.getDataStructureComponents().getDimensionList().getDimensions()[i];
            keynames.push(dim1.getId().toString());
        }
        if (struct.getDataStructureComponents().getDimensionList().getMeasureDimension() != null) {
            var dim2: structure.MeasureDimension = struct.getDataStructureComponents().getDimensionList().getMeasureDimension();
            keynames.push(dim2.getId().toString());
        }
        return keynames;
    }

    public getTimeKeyName(): string {
        var struct: structure.DataStructure = this.registry.findDataStructure(this.structRef);
        if (struct.getDataStructureComponents().getDimensionList().getTimeDimension() == null) {return null;}
        return struct.getDataStructureComponents().getDimensionList().getTimeDimension().getId().toString();
    }
    public getTimeQueryKey(): QueryKey {
        return this.timeQueryKey;
    }
    getDataflow(): structure.Dataflow {
        return this.flow;
    }
    getRegistry(): interfaces.LocalRegistry {
        return this.registry;
    }
    getStartDate(): Date {
        return this.startDate;
    }
    getEndDate(): Date {
        return this.endDate;
    }
    setStartDate(d: Date) {
        this.startDate = d;
    }
    setEndDate(d: Date) {
        this.endDate = d;
    }
    getQueryString() {
        var qString: string = "";
        var keyNames = this.getKeyNames();
        for (var i: number = 0; i < keyNames.length; i++) {
            qString += this.getQueryKey(keyNames[i]).getQueryString();
            if (i < (keyNames.length - 1)) {
                qString += ".";
            }
        }
        return qString;
    }
    getUpdatedAfter(): Date {return this.updatedAfter;}
    setUpdatedAfter(d: Date) {this.updatedAfter = d;}
    getFirstNObservations(): number {
        return this.firstNObservations;
    }
    setFirstNObservations(n: number) {
        this.firstNObservations = n;
    }
    getLastNObservations(): number {
        return this.lastNObservations;
    }
    setLastNObservations(n: number) {
        this.lastNObservations = n;
    }
    getDimensionAtObservation(): string {
        return this.dimensionAtObservation;
    }
    setDimensionAtObservation(s: string) {
        this.dimensionAtObservation = s;
    }
    setDetail(s: string) {this.detail = s;}
    getDetail(): string {return this.detail;}
    getIncludeHistory(): boolean {return this.includeHistory;}
    setIncludeHistory(b: boolean) {this.includeHistory = b;}
    setProviderRef(s: string) {this.providerRef = s;}
    getProviderRef(): string {
        return this.providerRef;
    }
    size(): number {
        return this.query.length;

    }
}
export class QueryKey {
    private all: boolean = false;
    private structRef: commonreferences.Reference = null;
    private registry: interfaces.LocalRegistry = null;
    private name: string = null;
    private values: Array<string> = [];
    private possibleValues:Array<structure.ItemType> = [];
    constructor(structRef: commonreferences.Reference, registry: interfaces.LocalRegistry, s: string) {
        this.structRef = structRef;
        this.registry = registry;
        this.name = s;
    }
    public getName(): string {return this.name;}
    public getValues(): Array<string> {
        return this.values;
    }
    public setName(s: string) {this.name = s;}
    public setValue(a: Array<string>) {
        this.values = a;
    }
    public addValue(s: string) {
        console.log("AddValue"+s);
        for (var i: number = 0; i < this.values.length; i++) {
            // already in here
            if (this.values[i] == s) {
                console.log("Value already in here");
            return;
            }
        }
        if(s=='undefined')return;
        if(s==null)return;
        this.values.push(s);
    }
    public removeValue(s: string) {
        console.log("RemValue"+s);
        collections.arrays.remove(this.values, s);
    }
    public getItemScheme(): structure.ItemSchemeType {
        var comp: structure.Component = this.registry.findDataStructure(this.structRef).findComponentString(this.name);
        var lr = comp.getLocalRepresentation();
        if (lr == null || lr.getEnumeration() == null) {
            var conceptScheme: structure.ConceptSchemeType = this.registry.findConceptScheme(comp.getConceptIdentity());
            return conceptScheme;
        } else {
            if (lr != null) {
                var codelist = this.registry.findCodelist(lr.getEnumeration());
                return codelist;
            }
            // lr == null
            return null;
        }
    }
    public isAll(): boolean {
        return this.all;
    }
    public setAll(b: boolean) {
        this.all = b;
    }
    public possibleValuesString(): Array<string> {
        var result = [];
        for(var i:number=0;i<this.possibleValues.length;i++) {
            result.push(structure.NameableType.toString(this.possibleValues[i]));
        }
        return result;
    }
    public getPossibleValues(): Array<structure.ItemType> {
        this.possibleValues=this.removeDuplicates(this.possibleValues);
        return this.possibleValues;
    }
    public setPossibleValues(list:Array<structure.ItemType>){
        this.possibleValues=list;
    }
    getQueryString() {
        if (this.isAll()) {
            return "";
        } else {
            var s: string = "";
            for (var i: number = 0; i < this.values.length; i++) {
                s += this.values[i];
                if (i < (this.values.length - 1)) {
                    s += "+";
                }
            }
            return s;
        }
    }
    public containsValue(s:string) {
        for (var i: number = 0; i < this.values.length;i++) {
            if (this.values[i]==s ) return true;
        }
        return false;
    }
    public clear() {
        this.values = [];
    }
    public removeDuplicates(list: Array<structure.ItemType>): Array<structure.ItemType> {
    return _.uniq(list, function (e) {
        return e.getId().toString();
        });
    }
    public size() {
        return this.values.length;
    }
    public get(n:number) {
        return this.values[n];
    }
    public set(n:number,s:string) {
        this.values[n]=s;
    }
}

export class FlatObs {
    private values: Array<string> = [];
    constructor(vals: Array<string>) {
        this.values = vals;
        if (vals == null) {
            this.values = [];
        }
    }
    setValue(i: number, o: string) {
        if (this.values.length <= i) {
            for (var j: number = this.values.length; (j - 1) < i; j++) {
                this.values.push(null);
            }
        }
        this.values[i] = o;
    }
    getValue(i: number): string {
        if (i >= this.values.length) {return null;}
        return this.values[i];
    }
    dump() {
        var s: string = "";
        for (var i: number = 0; i < this.values.length; i++) {
            s += this.values[i];
            if (i < this.values.length) s += " ";
        }
        console.log(s);
    }
    size(): number {
        return this.values.length;
    }

}


export class AttachmentLevel {
    private static LIST: Array<AttachmentLevel> = [];

    public static ATTACHMENT_DATASET: number = 0;
    public static ATTACHMENT_SERIES: number = 1;
    public static ATTACHMENT_OBSERVATION: number = 2;
    public static ATTACHMENT_GROUP: number = 3;
    public static ATTACHMENT_DATASET_STRING: string = "DataSet";
    public static ATTACHMENT_SERIES_STRING: string = "Series";
    public static ATTACHMENT_OBSERVATION_STRING: string = "Observation";
    public static ATTACHMENT_GROUP_STRING: string = "Group";
    public static DATASET: AttachmentLevel = new AttachmentLevel(AttachmentLevel.ATTACHMENT_DATASET_STRING, AttachmentLevel.ATTACHMENT_DATASET);
    public static SERIES: AttachmentLevel = new AttachmentLevel(AttachmentLevel.ATTACHMENT_SERIES_STRING, AttachmentLevel.ATTACHMENT_SERIES);
    public static OBSERVATION: AttachmentLevel = new AttachmentLevel(AttachmentLevel.ATTACHMENT_OBSERVATION_STRING, AttachmentLevel.ATTACHMENT_OBSERVATION);
    public static GROUP: AttachmentLevel = new AttachmentLevel(AttachmentLevel.ATTACHMENT_GROUP_STRING, AttachmentLevel.ATTACHMENT_GROUP);

    private name: string = null;
    private id: number = 0;



    constructor(s: string, id: number) {
        this.name = s;
        this.id = id;
        AttachmentLevel.LIST.push(this);
    }
    public getName(): string {return this.name;}
    public getId(): number {return this.id;}
    public static fromString(s: string): AttachmentLevel {
        for (var i: number = 0; i < AttachmentLevel.LIST.length; i++) {
            if (AttachmentLevel.LIST[i].getName() == s) return AttachmentLevel.LIST[i];
        }
        return null;
    }
    public static fromId(id: number): AttachmentLevel {
        for (var i: number = 0; i < AttachmentLevel.LIST.length; i++) {
            if (AttachmentLevel.LIST[i].getId() == id) return AttachmentLevel.LIST[i];
        }
        return null;
    }


}
export class AbstractKey {
    private dict = new collections.Dictionary<string, any>();
    private attributes = new collections.Dictionary<string, any>();
    constructor() {

    }

    getComponent(s: string): any {
        return this.dict.getValue(s);
    }
    setComponent(s: string, v: any) {
        this.dict.setValue(s, v);
    }
    getAttribute(s: string): any {
        return this.attributes.getValue(s);
    }
    setAttribute(s: string, v: any) {
        this.attributes.setValue(s, v);
    }
    clearAttributes() {
        this.attributes.clear();
    }
    toString() {
        return this.dict.values().join(":");
    }
    getDict() { return this.dict; }
}
export class PartialKey extends AbstractKey {
}
export class FullKey extends AbstractKey {
}


export class Group {
    private groupName: string = null;
    private groupKey: collections.Dictionary<string, any> = new collections.Dictionary<string, any>();
    private groupAttributes: collections.Dictionary<string, any> = new collections.Dictionary<string, any>();

    private map: collections.Dictionary<string, any> = new collections.Dictionary<string, any>();

    constructor() {

    }

    public static Group(groupValues: collections.Dictionary<string, any>): Group {
        var g: Group = new Group();
        g.map = groupValues;
        return g;
    }

    putGroupValue(concept: string, value: any) {
        this.map.setValue(concept, value);
    }

    getGroupValue(concept: string): any {
        return this.groupAttributes.getValue(concept);
    }

    processGroupValues(ds: interfaces.DataSet) {
        this.groupAttributes = new collections.Dictionary<string, any>();
        var keys: Array<string> = this.map.keys();
        for (var i = 0; i < keys.length; i++) {
            var s: string = keys[i];
            if (ds.getColumnMapper().getColumnIndex(s) == -1 || ds.getColumnMapper().isAttachedToGroupString(s)) {
                this.groupAttributes.setValue(s, this.map.getValue(s));
                if (!ds.getColumnMapper().isAttachedToGroupString(s)) {
                    ds.getColumnMapper().registerColumn(s, AttachmentLevel.GROUP);
                }
            } else {
                this.groupKey.setValue(s, this.map.getValue(s));
                collections.arrays.remove(keys, s);
            }
        }
        this.map = null;
    }

    getGroupKey(): collections.Dictionary<string, any> {
        return this.groupKey;
    }
    public matches(key: FullKey): boolean {
        var keys: Array<string> = this.getGroupKey().keys();
        for (var i = 0; i < keys.length; i++) {
            var s: string = keys[i];
            var gv: any = this.getGroupKey().getValue(s);
            if (gv != null) {
                if (!(key.getComponent(s) == gv)) {
                    return false;
                }
            }
        }
        return true;
    }
    getGroupAttributes(): collections.Dictionary<string, any> {
        return this.groupAttributes;
    }
    getGroupName(): string {
        return this.groupName;
    }

    setGroupName(groupName: string) {
        this.groupName = groupName;
    }

    setGroupValue(columnName: string, val: string) {
        this.groupAttributes.setValue(columnName, val);
    }
}
export class FlatColumnMapper implements interfaces.ColumnMapper {

    private columns: Array<string> = [];
    private groupColumns: Array<string> = [];

    registerColumn(s: string, attach: AttachmentLevel): number {
        if (collections.arrays.contains(this.columns, s) || collections.arrays.contains(this.groupColumns, s)) {
            throw new Error("Attempt to Register already registered Column!!");
        }
        if (attach == AttachmentLevel.GROUP) {
            this.groupColumns.push(s);
            this.columns.push(s);
            return this.columns.indexOf(s);
        } else {
            this.columns.push(s);
            return this.columns.indexOf(s);
        }
    }

    getColumnIndex(s: string): number {
        return this.columns.indexOf(s);
    }

    getColumnName(i: number): string {
        return this.columns[i];
    }

    size(): number {
        return this.columns.length;
    }

    containsColumn(name: string): boolean {
        for (var i: number = 0; i < this.columns.length; i++) {
            if (this.columns[i] == name) {
                return true;
            }
        }
        return false;
    }

    getAllColumns(): Array<string> {
        var result: Array<string> = [];
        for (var i: number = 0; i < this.columns.length; i++) {
            result.push(this.columns[i]);
        }
        return result;
    }

    getObservationColumns(): Array<string> {
        var result: Array<string> = [];
        for (var i: number = 0; i < this.columns.length; i++) {
            result.push(this.columns[i]);
        }
        return result;

    }

    getSeriesColumns(): Array<string> {
        return [];
    }

    getDataSetColumns(): Array<string> {
        return [];
    }

    getGroupColumns(): Array<string> {
        return [];
    }

    isAttachedToDataSetString(s: string): boolean {
        return false;
    }

    isAttachedToDataSetInt(i: number): boolean {
        return false;
    }

    isAttachedToSeriesString(s: string): boolean {
        return false;
    }

    isAttachedToSeriesInt(i: number): boolean {
        return false;
    }

    isAttachedToObservationString(s: string): boolean {
        return collections.arrays.contains(this.columns, s);
    }

    isAttachedToObservationInt(i: number): boolean {
        return true;
    }

    isAttachedToGroupString(s: string): boolean {
        return collections.arrays.contains(this.groupColumns, s);
    }

    isAttachedToGroupInt(i: number): boolean {
        return this.isAttachedToGroupString(this.getColumnName(i));
    }

    dump() {
        console.log("Column Mapper");
        for (var i: number = 0; i < this.size(); i++) {
            console.log(i + " = " + this.getColumnName(i));
        }

    }
}

export class FlatDataSet implements interfaces.DataSet {

    private groups: Array<Group> = [];
    private mapper: FlatColumnMapper = new FlatColumnMapper();
    private observations: Array<FlatObs> = [];

    private dimensionAtObservation: string = "AllDimensions";

    public FlatDataSet() {
    }

    getColumnIndex(name: string): number {
        return this.mapper.getColumnIndex(name);
    }

    getValue(row: number, col: number): string {
        if (this.observations[row] == null) {
            console.log("null obs!");
        }
        return this.observations[row].getValue(col);
    }

    setValueStringCol(row: number, col: string, val: string) {
        this.setValue(row, this.mapper.getColumnIndex(col), val);
    }

    setValue(row: number, col: number, val: string) {
        this.observations[row].setValue(col, val);
    }

    addObservation(o: FlatObs) {
        this.observations.push(o);
    }

    removeObservation(o: FlatObs) {
        collections.arrays.remove(this.observations, o);
    }

    getObservations() {
        return this.observations;
    }
    size(): number {
        return this.observations.length;
    }

    getColumnMapper(): FlatColumnMapper {
        return this.mapper;
    }

    dump() {
        var s: string = "";
        for (var i: number = 0; i < this.mapper.size(); i++) {
            s += this.getColumnMapper().getColumnName(i);
            s += "\t";
        }
        console.log(s);
        for (var i: number = 0; i < this.observations.length; i++) {
            var o: FlatObs = this.getFlatObs(i);
            var s: string = "";
            for (var j: number = 0; j < this.mapper.size(); j++) {
                s = s + o.getValue(j);
                if (j < this.mapper.size()) s = s + "\t";
            }
            console.log(s);
        }
    }
    getFlatObs(i: number): FlatObs {
        return this.observations[i];
    }
    registerColumn(s: string) {
        var col: number = this.mapper.registerColumn(s, AttachmentLevel.OBSERVATION);
        for (var i: number = 0; i < this.observations.length; i++) {
            this.observations[i].setValue(col, null);
        }
        return col;
    }

    getColumnName(i: number): string {
        return this.mapper.getColumnName(i);
    }

    getColumnSize(): number {
        return this.mapper.size();
    }

    getGroups() {
        return [];
    }

    groupSize(): number {
        return 0;
    }

    applyGroupKey(key: PartialKey, column: string, value: string) {
    }

    setGroups(groups: Array<Group>) {
    }

    query(cube: Cube, order: Array<string>): Cube {
        var time: number = new Date().getTime();
        for (var i: number = 0; i < this.size(); i++) {
            cube.putObservation(order, this.mapper, this.getFlatObs(i));
        }
        return cube;
    }

    find(key: FullKey): FlatObs {
        var found: boolean = true;
        for (var i: number = 0; i < this.size(); i++) {
            var obs: FlatObs = this.getFlatObs(i);
            found = true;
            for (var j: number = 0; j < this.mapper.size() && !found; j++) {
                if (!(structure.NameableType.toIDString(key.getComponent(this.mapper.getColumnName(j))) == obs.getValue(j))) {
                    found = false;
                }
            }
            if (found) {
                return obs;
            }
        }
        return null;
    }
    getDimensionAtObservation(reg: interfaces.LocalRegistry, dsref: commonreferences.Reference) {
        return "AllDimensions";
    }

    setDimensionAtObservationString(s: string) {
        this.dimensionAtObservation = s;
    }

    getDimensionAtObservationString(): string {
        return this.dimensionAtObservation;
    }
}
export class FlatDataSetWriter implements interfaces.DataSetWriter {

    private mapper: FlatColumnMapper = new FlatColumnMapper();
    private dataSet: FlatDataSet = null;
    private dataSetValues: Array<string> = null;
    private seriesValues: Array<string> = null;
    private obsValues: Array<string> = null;
    private groups: Array<Group> = null;

    constructor() {
    }

    newDataSet() {
        this.dataSet = new FlatDataSet();
        this.dataSetValues = [];
        this.mapper = this.dataSet.getColumnMapper();
    }

    newSeries() {
        this.seriesValues = [];
        for (var i: number = 0; i < this.dataSetValues.length; i++) {
            this.seriesValues.push(this.dataSetValues[i]);
        }
    }

    newObservation() {
        this.obsValues = [];
        if (this.seriesValues != null) {
            for (var i: number = 0; i < this.seriesValues.length; i++) {
                this.obsValues.push(this.seriesValues[i]);
            }
        }
    }

    writeDataSetComponent(name: string, val: string) {
        if (!this.dataSet.getColumnMapper().containsColumn(name)) {
            this.dataSet.registerColumn(name);
        }
        this.dataSetValues.push(val);
    }

    writeSeriesComponent(name: string, val: string) {
        if (!this.dataSet.getColumnMapper().containsColumn(name)) {
            this.dataSet.registerColumn(name);
        }
        this.seriesValues.push(val);
    }

    writeObservationComponent(name: string, val: string) {
        if (!this.dataSet.getColumnMapper().containsColumn(name)) {
            this.dataSet.registerColumn(name);
        }
        if (this.obsValues.length <= this.dataSet.getColumnMapper().getColumnIndex(name)) {
            for (var j: number = this.obsValues.length; (j - 1) < this.dataSet.getColumnIndex(name); j++) {
                this.obsValues.push(null);
            }
        }
        this.obsValues[this.dataSet.getColumnIndex(name)] = val;
    }

    finishSeries() {

    }

    finishObservation() {
        this.dataSet.addObservation(new FlatObs(this.obsValues));
    }

    finishDataSet(): FlatDataSet {
        var ds: FlatDataSet = this.dataSet;
        ds.setGroups(this.groups);
        this.dataSet = null;
        return ds;
    }

    getColumnMapper(): FlatColumnMapper {
        return this.mapper;
    }

    writeGroupValues(name: string, groupValues: collections.Dictionary<string, Object>) {
        var group: Group = Group.Group(groupValues);
        group.setGroupName(name);
        if (this.groups == null) {
            this.groups = [];
        }
        this.groups.push(group);
    }
}
export class StructuredDataMessage {

    private dataMessage: message.DataMessage = null;
    private registry: interfaces.LocalRegistry = null;
    private dataflow: structure.Dataflow = null;

    private list: Array<StructuredDataSet> = [];

    constructor(dm: message.DataMessage, reg: interfaces.LocalRegistry) {
        this.dataMessage = dm;
        this.registry = reg;
        for (var i: number = 0; i < this.dataMessage.size(); i++) {
            this.list.push(this.buildStructuredDataSet(i));
        }
    }

    public size(): number {
        return this.getDataMessage().size();
    }

    public getStructuredDataSet(i: number): StructuredDataSet {
        return this.list[i];
    }

    public buildStructuredDataSet(i: number): StructuredDataSet {
        //dataMessage.getHeader().getStructures().get(0).getStructure().dump();
        //NestedNCNameID agency = dataMessage.getHeader().getStructures().get(0).getStructure().getAgencyId();
        //IDType id = dataMessage.getHeader().getStructures().get(0).getStructure().getMaintainableParentId();
        //Version vers = dataMessage.getHeader().getStructures().get(0).getStructure().getMaintainedParentVersion();
        //System.out.println("Ref="+agency+":"+id+":"+vers);
        var structure: structure.DataStructure = this.getRegistry().findDataStructure(this.getDataMessage().getHeader().getStructures()[0].getStructure());
        //System.out.println("Structure="+structure);
        if (this.dataflow == null) {
            this.setDataflow(structure.asDataflow());
        }
        return new StructuredDataSet(this.getDataMessage().getDataSet(i), this.getRegistry(), structure);
    }

    /**
     * @return the dataMessage
     */
    public getDataMessage(): message.DataMessage {
        return this.dataMessage;
    }

    /**
     * @return the registry
     */
    public getRegistry(): interfaces.LocalRegistry {
        return this.registry;
    }

    /**
     * @return the dataflow
     */
    public getDataflow(): structure.Dataflow {
        return this.dataflow;
    }

    /**
     * @param dataflow the dataflow to set
     */
    public setDataflow(dataflow: structure.Dataflow) {
        this.dataflow = dataflow;
    }
}
export class StructuredDataSet {
    private dataSet: interfaces.DataSet = null;
    private registry: interfaces.LocalRegistry = null;
    private structure: structure.DataStructure = null;

    constructor(ds: interfaces.DataSet, reg: interfaces.LocalRegistry, struct: structure.DataStructure) {
        this.dataSet = ds;
        this.registry = reg;
        this.structure = struct;
    }

    public getStructuredValue(row: number, column: number): StructuredValue {
        return new StructuredValue(this.getDataSet().getColumnName(column), this.getDataSet().getValue(row, column), this.registry, this.getStructure());
    }

    public getColumnName(i: number): string {
        var conceptString: string = this.getDataSet().getColumnName(i);
        //System.out.println("Concept="+conceptString);
        //System.out.println("ds="+getStructure());
        var c: structure.Component = this.getStructure().findComponentString(conceptString);
        if (c == null && conceptString == "type") {
            // "type" represents sdmx 2.0 cross sectional document 
            c = this.getStructure().getDataStructureComponents().getDimensionList().getMeasureDimension();
        }
        if (c == null) {
            console.log("Component is null conceptRef:" + conceptString);
            return conceptString;
        }
        var conceptRef = c.getConceptIdentity();
        var concept: structure.ConceptType = null;
        if (conceptRef != null) {
            concept = this.registry.findConcept(conceptRef);
            return structure.NameableType.toString(concept);
        } else {
            return conceptString;
        }
    }

    public size(): number {
        return this.getDataSet().size();
    }

    public getColumnCount(): number {
        return this.getDataSet().getColumnSize();
    }

    /**
     * @return the dataSet
     */
    public getDataSet(): interfaces.DataSet {
        return this.dataSet;
    }

    /**
     * @return the structure
     */
    public getStructure(): structure.DataStructure {
        return this.structure;
    }
    public getColumnIndexes(): Array<number> {
        var result = [];
        for (var i: number = 0; i < this.getColumnCount(); i++) {
            result.push(i);
        }
        return result;
    }
}
export class StructuredValue {
    public getRepresentation(reg: interfaces.LocalRegistry, c: structure.Component): structure.RepresentationType {
        var rep: structure.RepresentationType = c.getLocalRepresentation();
        if (rep == null) {
            var concept: structure.ConceptType = reg.findConcept(c.getConceptIdentity());
            //return concept.getCoreRepresentation();
        }
        return c.getLocalRepresentation();
    }
    public getLocalRepresentation(c: structure.Component): structure.RepresentationType {
        if (c == null) return null;
        return c.getLocalRepresentation();
    }
    private concept: string = null;
    private value: string = null;
    private registry: interfaces.LocalRegistry = null;
    private structure: structure.DataStructure = null;

    public constructor(concept: string, value: string, registry: interfaces.LocalRegistry, struct: structure.DataStructure) {
        this.concept = concept;
        this.value = value;
        this.registry = registry;
        this.structure = struct;
    }

    public isCoded(): boolean {
        var comp: structure.Component = this.structure.findComponentString(this.concept);
        if ("type" == this.concept) {
            comp = this.structure.getDataStructureComponents().getDimensionList().getMeasureDimension();
        }
        if (comp == null) {
            console.log("Comp is NUll!" + this.concept);
            return false;
        }
        var localRep: structure.RepresentationType = this.getRepresentation(this.registry, comp);
        if (localRep.getEnumeration() != null) {
            return true;
        }
        else return false;
    }

    public getCode(): structure.ItemType {
        //System.out.println("Concept:"+ concept+" Value:" + value);
        //Locale loc = Locale.getDefault();
        //ItemType item = ValueTypeResolver.resolveCode(registry, structure, concept, value);
        //System.out.println("Item=" + item.toString());
        //System.out.println("Item=" + item.findName(loc.getLanguage()));
        return ValueTypeResolver.resolveCode(this.registry, this.structure, this.concept, this.getValue());
    }

    public getCodelist(): structure.ItemSchemeType {
        return ValueTypeResolver.getPossibleCodes(this.registry, this.structure, this.concept);
    }

    public toString(): string {
        if (this.isCoded()) {
            var code: structure.ItemType = this.getCode();
            if (code == null) {
                return this.getValue();
            }
            return structure.NameableType.toString(code);
        }
        return this.getValue();
    }

    /**
     * @return the concept
     */
    public getConcept(): structure.ConceptType {
        return this.registry.findConcept(this.structure.findComponentString(this.concept).getConceptIdentity());
    }

    /**
     * @return the value
     */
    public getValue(): string {
        return this.value;
    }
}
export class ValueTypeResolver {

    public static resolveCode(registry: interfaces.LocalRegistry, struct: structure.DataStructure, column: string, value: string): structure.ItemType {
        if (value == null) {
            return null;
        }
        var dim: structure.Component = struct.findComponentString(column);
        // Cross Sectional Measures somtimes come in a a 'type' column..
        // see SDMX 2.0 example cross sectional file
        if ("type" == column) {
            dim = struct.getDataStructureComponents().getDimensionList().getMeasureDimension();
        }
        if (dim == null) {
            var itm: structure.CodeType = new structure.CodeType();
            var name: common.Name = new common.Name(sdmx.SdmxIO.getLocale(), value);
            var names: Array<common.Name> = [name];
            itm.setNames(names);
            return itm;
        }
        var conceptRef = dim.getConceptIdentity();
        var rep: structure.RepresentationType = null;
        var concept: structure.ConceptType = null;
        if (conceptRef != null) {
            concept = registry.findConcept(conceptRef);
            if (concept == null) {
                console.log("Cant find concept:" + dim.getConceptIdentity().getId());
                console.log(conceptRef.getAgencyId() + ":" + conceptRef.getMaintainableParentId() + ":" + conceptRef.getId() + ":" + conceptRef.getVersion());
                var ct: structure.CodeType = new structure.CodeType();
                ct.setId(new commonreferences.ID(value));
                var name: common.Name = new common.Name("en", value);
                ct.setNames([name]);
                return ct;
            }
            rep = dim.getLocalRepresentation();
        }
        if (rep != null) {
            if (rep.getEnumeration() != null) {
                if (rep.getEnumeration().getRefClass().toInt() == commonreferences.ObjectTypeCodelistType.CODELIST.toInt()) {
                    var codelist: structure.Codelist = registry.findCodelist(rep.getEnumeration());
                    var id: commonreferences.ID = null;
                    try {
                        id = new commonreferences.ID(value);
                    } catch (err) {
                        // Ignore
                    }
                    if (codelist == null) {
                        throw new Error("Codelist is null Representation=" + rep.getEnumeration().toString());
                    }
                    var ct: structure.CodeType = null;
                    if (id != null) {
                        ct = codelist.findItemId(id);
                    }
                    if (ct == null) {
                        var ct2: structure.CodeType = new structure.CodeType();
                        ct2.setId(id);
                        var name: common.Name = new common.Name("en", "Missing Code:" + value);
                        var names: Array<common.Name> = [];
                        names.push(name);
                        ct2.setNames(names);
                        return ct2;
                    } else {
                        return ct;
                    }
                } else {
                    var cs: structure.ConceptSchemeType = registry.findConceptScheme(rep.getEnumeration());
                    var conceptMeasure: structure.ConceptType = null;
                    for (var i: number = 0; i < cs.size() && conceptMeasure == null; i++) {
                        var tempConcept: structure.ConceptType = cs.getItem(i);
                        if (tempConcept.getId() != null && tempConcept.getId().toString() == value) {
                            conceptMeasure = cs.getItem(i);
                        } else if (tempConcept.getId().toString() == value) {
                            conceptMeasure = tempConcept;
                        }
                    }
                    if (conceptMeasure != null) {
                        //System.out.println("ConceptMeasure:"+conceptMeasure);
                        return conceptMeasure;

                    }
                    return null;
                }
            }
            else {
                var itm: structure.CodeType = new structure.CodeType();
                var name: common.Name = new common.Name(sdmx.SdmxIO.getLocale(), value);
                var names: Array<common.Name> = [name];
                itm.setNames(names);
                return itm;
            }
        }
        var itm: structure.CodeType = new structure.CodeType();
        var name: common.Name = new common.Name(sdmx.SdmxIO.getLocale(), value);
        var names: Array<common.Name> = [name];
        itm.setNames(names);
        return itm;
    }

    public static getPossibleCodes(registry: interfaces.LocalRegistry, struct: structure.DataStructure, column: string): structure.ItemSchemeType {
        var dim: structure.Component = struct.findComponentString(column);
        if (dim == null || "type" == column) {
            dim = struct.getDataStructureComponents().getDimensionList().getMeasureDimension();
        }
        var conceptRef = dim.getConceptIdentity();
        var rep: structure.RepresentationType = null;
        var concept: structure.ConceptType = null;
        if (conceptRef != null) {
            concept = registry.findConcept(conceptRef);
            rep = dim.getLocalRepresentation();
        }
        if (rep != null) {
            if (rep.getEnumeration() != null) {
                if (rep.getEnumeration().getRefClass().toInt() == commonreferences.ObjectTypeCodelistType.CODELIST.toInt()) {
                    var codelist: structure.Codelist = registry.findCodelist(rep.getEnumeration());
                    return codelist;
                } else {
                    var cs: structure.ConceptSchemeType = registry.findConceptScheme(rep.getEnumeration());
                    return cs;
                }
            }
        }
        return null;
    }
}

export class Cube {

    private size: number = 0;
    private order: Array<string> = [];
    private struct: structure.DataStructure = null;
    private reg: interfaces.LocalRegistry = null;
    private mapper: FlatColumnMapper = new FlatColumnMapper();
    private cubeObsMapper: FlatColumnMapper = new FlatColumnMapper();
    private flatObsMapper: FlatColumnMapper = new FlatColumnMapper();

    private validCodes: collections.Dictionary<string, Array<string>> = new collections.Dictionary<string, Array<string>>();

    constructor(struct: structure.DataStructure, reg: interfaces.LocalRegistry) {
        this.struct = struct;
        this.reg = reg;
    }

    public getStructure(): structure.DataStructure {
        return this.struct;
    }

    public getStructureReference(): commonreferences.Reference {
        return this.struct.asReference();
    }

    private root: RootCubeDimension = new RootCubeDimension();

    public getRootCubeDimension(): RootCubeDimension {
        return this.root;
    }

    public putObservation(order: Array<string>, mapper: interfaces.ColumnMapper, obs: FlatObs) {
        var dim: ListCubeDimension = this.getRootCubeDimension();
        this.order = order;
        var time: TimeCubeDimension = null;
        var cubeobs: CubeObservation = null;
        for (var i: number = 0; i < this.struct.getDataStructureComponents().getDimensionList().getDimensions().length; i++) {
            //if( struct.getDataStructureComponents().getDimensionList().getDimension(i).)
            // This line goes through the components in their datastructure order
            //IDType dimId = struct.getDataStructureComponents().getDimensionList().getDimension(i).getId();
            // This line goes through the components in their specified order
            var dimId: commonreferences.ID = null;
            if (order != null) {
                dimId = new commonreferences.ID(order[i]);
            } else {
                dimId = this.struct.getDataStructureComponents().getDimensionList().getDimensions()[i].getId();
            }
            if (this.validCodes[dimId.toString()] == null) {
                this.validCodes[dimId.toString()] = [];
                if (this.mapper.getColumnIndex(dimId.toString()) == -1) {
                    this.mapper.registerColumn(dimId.toString(), AttachmentLevel.OBSERVATION);
                    this.cubeObsMapper.registerColumn(dimId.toString(), AttachmentLevel.OBSERVATION);
                    this.flatObsMapper.registerColumn(dimId.toString(), AttachmentLevel.OBSERVATION);
                }
            }
            /*
                If the data you are trying to make a cube from does not have a complete key
                with values for all dimensions, mapper.getColumnIndex(dimId.toString()) returns -1
                here (because there is no dimension of that name in the FlatObservation)
                this filters down into FlatObservation.getValue(-1) which causes an array index
                out of bounds exception!
             */
            if (mapper.getColumnIndex(dimId.toString()) == -1) {
                this.mapper.registerColumn(dimId.toString(), AttachmentLevel.OBSERVATION);
                this.cubeObsMapper.registerColumn(dimId.toString(), AttachmentLevel.OBSERVATION);
                this.flatObsMapper.registerColumn(dimId.toString(), AttachmentLevel.OBSERVATION);
            }
            var myDim: CubeDimension = dim.getSubCubeDimension(obs.getValue(mapper.getColumnIndex(dimId.toString())));
            if (myDim == null) {
                myDim = new ListCubeDimension(dimId.toString(), obs.getValue(mapper.getColumnIndex(dimId.toString())));
                dim.putSubCubeDimension(myDim);
                if (!collections.arrays.contains(this.validCodes[dimId.toString()], myDim.getValue())) {
                    this.validCodes[dimId.toString()].push(myDim.getValue());
                }
            }
            dim = <ListCubeDimension> myDim;
        }
        var myDim: CubeDimension = null;
        var dimId: commonreferences.ID = this.struct.getDataStructureComponents().getDimensionList().getTimeDimension().getId();
        if (this.validCodes[dimId.toString()] == null) {
            this.validCodes[dimId.toString()] = [];
        }
        var i: number = this.mapper.getColumnIndex(dimId.toString());
        var s: string = obs.getValue(i);
        myDim = dim.getSubCubeDimension(obs.getValue(mapper.getColumnIndex(dimId.toString())));
        if (myDim == null) {
            myDim = new TimeCubeDimension(dimId.toString(), obs.getValue(mapper.getColumnIndex(dimId.toString())));
            dim.putSubCubeDimension(myDim);
            if (!collections.arrays.contains(this.validCodes[dimId.toString()], myDim.getValue())) {
                this.validCodes[dimId.toString()].push(myDim.getValue());
            }
        }
        time = <TimeCubeDimension> myDim;
        var cross: string = null;
        var dimId2: commonreferences.ID = null;
        if (this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension() != null) {
            dimId2 = this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension().getId();
            if (this.validCodes[dimId2.toString()] == null) {
                this.validCodes[dimId2.toString()] = [];
                if (this.mapper.getColumnIndex(dimId2.toString()) == -1) {
                    this.mapper.registerColumn(dimId2.toString(), AttachmentLevel.OBSERVATION);
                    this.cubeObsMapper.registerColumn(dimId2.toString(), AttachmentLevel.OBSERVATION);
                    this.flatObsMapper.registerColumn(dimId2.toString(), AttachmentLevel.OBSERVATION);
                }
            }
            cross = obs.getValue(mapper.getColumnIndex(dimId2.toString()));
            if (!collections.arrays.contains(this.validCodes[dimId2.toString()], cross)) {
                this.validCodes[dimId2.toString()].push(cross);
            }
        }

        var dimId3: commonreferences.ID = this.struct.getDataStructureComponents().getMeasureList().getPrimaryMeasure().getId();
        if (dimId2 != null) {
            cubeobs = new CubeObservation(dimId2.toString(), cross, dimId3.toString(), obs.getValue(mapper.getColumnIndex(dimId3.toString())));
            if (this.mapper.getColumnIndex(dimId2.toString()) == -1) {
                this.mapper.registerColumn(dimId2.toString(), AttachmentLevel.OBSERVATION);
                this.cubeObsMapper.registerColumn(dimId2.toString(), AttachmentLevel.OBSERVATION);
            }
        } else {
            cubeobs = new CubeObservation(null, null, dimId3.toString(), obs.getValue(mapper.getColumnIndex(dimId3.toString())));
            if (this.mapper.getColumnIndex(dimId3.toString()) == -1) {
                this.mapper.registerColumn(dimId3.toString(), AttachmentLevel.OBSERVATION);
                this.flatObsMapper.registerColumn(dimId3.toString(), AttachmentLevel.OBSERVATION);
            }
        }

        time.putObservation(cubeobs);

        for (var k: number = 0; k < this.struct.getDataStructureComponents().getAttributeList().getAttributes().length; k++) {
            var name: string = this.struct.getDataStructureComponents().getAttributeList().getAttributes()[k].getId().toString();
            var value: string = null;
            if (mapper.getColumnIndex(name) != -1) {
                value = obs.getValue(mapper.getColumnIndex(name));
                cubeobs.putAttribute(new CubeAttribute(name, value));
            }
        }
        // Increment Size counter
        this.size++;
    }
    public getColumnMapper(): interfaces.ColumnMapper {
        return this.mapper;
    }
    public getFlatColumnMapper(): interfaces.ColumnMapper {
        return this.flatObsMapper;
    }
    public getCubeObsColumnMapper(): interfaces.ColumnMapper {
        return this.cubeObsMapper;
    }
    public findCubeObs(key: FullKey): CubeObs {
        return this.findLatestCubeObs(key, false);
    }
    public findFlatObs(key: FullKey): FlatObs {
        return this.findLatestFlatObs(key, false);
    }

    public findLatestCubeObs(key: FullKey, latest: boolean): CubeObs {
        var dim: CubeDimension = this.getRootCubeDimension();
        var oldDim: CubeDimension = dim;
        for (var i: number = 0; i < this.struct.getDataStructureComponents().getDimensionList().getDimensions().length; i++) {
            dim = dim.getSubCubeDimension(structure.NameableType.toIDString(key.getComponent(dim.getSubDimension())));
            if (dim == null) {
                console.log("Can't find dim:" + oldDim.getSubDimension()+":"+ structure.NameableType.toIDString(key.getComponent(oldDim.getSubDimension())));
                return null;
            }
            oldDim = dim;
        }
        var time: structure.TimeDimension = this.struct.getDataStructureComponents().getDimensionList().getTimeDimension();
        if (time == null) {
            throw new Error("Time Dimension Is Null");
        } else if (latest) {
            var timesList: Array<string> = dim.listDimensionValues();
            for (var i: number = 0; i < timesList.length; i++) {
                for (var j: number = 0; j < timesList.length - i; j++) {
                    var t1 = timepack.TimeUtil.parseTime(timesList[i], null);
                    var t2 = timepack.TimeUtil.parseTime(timesList[j], null);
                    if (t1.getStart() > t2.getStart()) {
                        collections.arrays.swap(timesList, i, j);
                    }
                }
            }
            var timeValue: string = timesList[timesList.length - 1];
            var tcd: TimeCubeDimension = <TimeCubeDimension> dim.getSubCubeDimension(timeValue);
            if (tcd == null) {
                //System.out.println("TCD null:"+key.getComponent(time.getId().toString()+":"+timeValue));
                //dim.dump();
                return null;
            }
            if (this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension() != null) {
                var measure: string = structure.NameableType.toIDString(key.getComponent(this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension().getId().toString()));
                //tcd.dump();
                //System.out.println("Measure="+measure);
                return tcd.getObservation(measure).toCubeObs(key, this.mapper);

            } else {
                var co: CubeObservation = tcd.getObservation(null);
                return co.toCubeObs(key, this.mapper);;
            }
        } else {
            var timeValue: string = structure.NameableType.toIDString(key.getComponent(time.getId().toString()));
            var tcd: TimeCubeDimension = <TimeCubeDimension> dim.getSubCubeDimension(timeValue);
            if (tcd == null) {
                //System.out.println("TCD null:"+key.getComponent(time.getId().toString()+":"+timeValue));
                //dim.dump();
                console.log("Time Cube Dimension is null");
                return null;
            }
            if (this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension() != null) {
                var measure: string = structure.NameableType.toIDString(key.getComponent(this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension().getId().toString()));
                //tcd.dump();
                //System.out.println("Measure="+measure);
                return tcd.getObservation(measure).toCubeObs(key, this.cubeObsMapper);
            } else {
                var co: CubeObservation = tcd.getObservation(null);
                return co.toCubeObs(key, this.cubeObsMapper)
            }
        }
    }


    public findLatestFlatObs(key: FullKey, latest: boolean): FlatObs {
        var dim: CubeDimension = this.getRootCubeDimension();
        var oldDim: CubeDimension = dim;
        for (var i: number = 0; i < this.struct.getDataStructureComponents().getDimensionList().getDimensions().length; i++) {
            dim = dim.getSubCubeDimension(structure.NameableType.toIDString(key.getComponent(dim.getSubDimension())));
            if (dim == null) {
                //System.out.println("Can't find dim:"+key.getComponent(order.get(i))+":"+oldDim.getSubDimension());
                return null;
            }
            oldDim = dim;
        }
        var time: structure.TimeDimension = this.struct.getDataStructureComponents().getDimensionList().getTimeDimension();
        if (time == null) {
            throw new Error("Time Dimension Is Null");
        } else if (latest) {
            var timesList: Array<string> = dim.listDimensionValues();
            for (var i: number = 0; i < timesList.length; i++) {
                for (var j: number = 0; j < timesList.length - i; j++) {
                    var t1 = timepack.TimeUtil.parseTime(timesList[i], null);
                    var t2 = timepack.TimeUtil.parseTime(timesList[j], null);
                    if (t1.getStart() > t2.getStart()) {
                        collections.arrays.swap(timesList, i, j);
                    }
                }
            }
            var timeValue: string = timesList[timesList.length - 1];
            var tcd: TimeCubeDimension = <TimeCubeDimension> dim.getSubCubeDimension(timeValue);
            if (tcd == null) {
                //System.out.println("TCD null:"+key.getComponent(time.getId().toString()+":"+timeValue));
                //dim.dump();
                return null;
            }
            if (this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension() != null) {
                var measure: string = key.getComponent(this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension().getId().toString());
                return tcd.getObservation(measure).toFlatObs(key, this.flatObsMapper);

            } else {
                var co: CubeObservation = tcd.getObservation(null);
                return co.toFlatObs(key, this.flatObsMapper);;
            }
        } else {
            var timeValue: string = key.getComponent(time.getId().toString());
            var tcd: TimeCubeDimension = <TimeCubeDimension> dim.getSubCubeDimension(timeValue);
            if (tcd == null) {
                //System.out.println("TCD null:"+key.getComponent(time.getId().toString()+":"+timeValue));
                //dim.dump();
                return null;
            }
            if (this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension() != null) {
                var measure: string = key.getComponent(this.struct.getDataStructureComponents().getDimensionList().getMeasureDimension().getId().toString());
                //tcd.dump();
                //console.log("Measure=" + measure);
                var co: CubeObservation = tcd.getObservation(measure);
                if (co == null) return null;
                return tcd.getObservation(measure).toFlatObs(key, this.flatObsMapper);
            } else {
                var co: CubeObservation = tcd.getObservation(null);
                return co.toFlatObs(key, this.flatObsMapper)
            }
        }
    }

    public getValues(col: string): Array<string> {
        var list = this.validCodes[col];
        if (list == null) {
            return [];
        }
        return list;
    }

    /**
     * @return the size
     */
    public getSize(): number {
        return this.size;
    }

    public getObservationCount(): number {
        return this.size;
    }

    public getAllItems(col: string): Array<structure.ItemType> {
        var com: structure.Component = this.getStructure().findComponentString(col);
        return this.reg.findItemType(com.getLocalRepresentation().getEnumeration()).getItems();
    }

    public getAllValues(col: string): Array<string> {
        var items = this.getAllItems(col);
        var result = [];
        for (var i: number = 0; i < items.length; i++) {
            result.push(items[i].getId().toString());
        }
        return result;
    }
    public getSparsity(): number {
        return (this.getObservationCount() / this.getCellCount()) * 100;
    }
    public getItems(col: string): Array<structure.ItemType> {
        var com: structure.Component = this.getStructure().findComponentString(col);
        var result = [];
        var items = this.reg.findItemType(com.getLocalRepresentation().getEnumeration()).getItems();
        var codes = this.getValues(col);
        for (var i: number = 0; i < items.length; i++) {
            for (var j: number = 0; j < codes.length; j++) {
                if (codes[j] == items[i].getId().getString()) {
                    result.push(items[i]);
                }
            }
        }
        return result;
    }
    public getCellCount(): number {
        var c: number = this.getValues(this.mapper.getColumnName(0)).length;
        for (var i: number = 1; i < this.mapper.size(); i++) {
            c *= this.getValues(this.mapper.getColumnName(i)).length;
        }
        return c;
    }
    public dump() {
        this.recurse(this.root, 0);
    }
    public recurse(dim: CubeDimension, n: number) {
        for (var i: number = 0; i < dim.listSubDimensions().length; i++) {
            this.recurse(dim.listSubDimensions()[i], n + 1);
        }
        console.log(n + ":" + dim.getConcept() + ":" + dim.getValue());
    }
}

export class CubeDimension {

    private concept: string = null;
    private value: string = null;

    private subDimension: string = null;
    private subDimensions: Array<CubeDimension> = [];


    constructor(concept: string, value: string) {
        this.concept = concept;
        this.value = value;
    }

    /**
     * @return the concept
     */
    public getConcept(): string {
        return this.concept;
    }

    /**
     * @param concept the concept to set
     */
    public setConcept(concept: string) {
        this.concept = concept;
    }

    public getSubCubeDimension(id: string): CubeDimension {
        for (var i: number = 0; i < this.subDimensions.length; i++) {
            if (this.subDimensions[i].getValue() == id) {return this.subDimensions[i];}
        }
        return null;
    }

    public putSubCubeDimension(sub: CubeDimension) {
        var sub2: CubeDimension = this.getSubCubeDimension(sub.getValue());
        if (sub2 != null) {
            // Remove Old Dimension
            this.subDimensions = this.subDimensions.splice(this.subDimensions.indexOf(sub2), 1);
        }
        this.subDimensions.push(sub);

    }

    public listSubDimensions(): Array<CubeDimension> {return this.subDimensions;}
    public listDimensionValues(): Array<string> {
        var result = [];
        for (var i: number = 0; i < this.subDimensions.length; i++) {
            result.push(this.subDimensions[i].getValue());
        }
        return result;
    }

    /**
     * @return the value
     */
    public getValue(): string {
        return this.value;
    }

    /**
     * @param value the value to set
     */
    public setValue(value: string) {
        this.value = value;
    }
    public dump() {
    }

    /**
     * @return the subDimension
     */
    public getSubDimension(): string {
        return this.subDimension;
    }

    /**
     * @param subDimension the subDimension to set
     */
    public setSubDimension(subDimension: string) {
        this.subDimension = subDimension;
    }
}



export class ListCubeDimension extends CubeDimension {
    private list: Array<CubeDimension> = [];
    constructor(concept: string, value: string) {
        super(concept, value);
        if (concept == null) {
            console.log("concept is null:ListCubeDimension");
        }
    }

    public getSubCubeDimension(id: string): CubeDimension {
        for (var i: number = 0; i < this.list.length; i++) {
            var cd: CubeDimension = this.list[i];
            if (cd.getValue() == id) {return cd;}
        }
        return null;
    }

    public putSubCubeDimension(sub: CubeDimension) {
        //console.log("ListCubeDimension.putSubCubeDimension()");
        var old: CubeDimension = this.getSubCubeDimension(sub.getValue());
        if (old != null) {
            this.list.splice(this.list.indexOf(old), 1);
        }
        this.list.push(sub);
        this.setSubDimension(sub.getConcept());
    }

    public listSubDimensions(): Array<CubeDimension> {
        return this.list;
    }

    public listDimensionValues(): Array<string> {
        var set: Array<string> = [];
        for (var i: number = 0; i < this.list.length; i++) {
            set.push(this.list[i].getValue());
        }
        return set;
    }
}

export class RootCubeDimension extends ListCubeDimension {
    constructor() {
        super(null, null);
    }
}

export class TimeCubeDimension extends CubeDimension {

    private obs: Array<CubeObservation> = [];

    constructor(concept: string, value: string) {
        super(concept, value);
    }

    public listObservations(): Array<CubeObservation> {
        return this.obs;
    }

    public putObservation(sub: CubeObservation) {
        this.obs.push(sub);
    }

    public getObservation(id: string): CubeObservation {
        for (var i: number = 0; i < this.obs.length; i++) {
            var c: CubeObservation = this.obs[i];
            if (c.getCrossSection() == null) {
                return c;
            }
            if (c.getCrossSection() == id) {
                return c;
            }
        }
        return null;
    }

    public listObservationValues(): Array<string> {
        // TO DO
        return [];
    }

    public listSubDimensions(): Array<CubeDimension> {
        return [];
    }

    public listDimensionValues(): Array<string> {
        return [];
    }
}

export class CubeObservation {
    private map: collections.Dictionary<string, CubeAttribute> = new collections.Dictionary<string, CubeAttribute>();
    private concept: string = null;
    private cross: string = null;
    private observationConcept: string = null;
    private value: string = null;

    constructor(crossSectionalMeasureConcept: string, crossSection: string, primaryMeasureConcept: string, value: string) {
        this.concept = crossSectionalMeasureConcept;
        this.cross = crossSection;
        this.observationConcept = primaryMeasureConcept
        this.value = value;
    }

    public getAttribute(id: string): CubeAttribute {
        return this.map.getValue(id);
    }

    public putAttribute(sub: CubeAttribute) {
        this.map.setValue(sub.getConcept(), sub);
    }

    public listAttributes(): Array<CubeAttribute> {
        return this.map.values();
    }

    public listAttributeNames(): Array<string> {
        return this.map.keys();
    }

    /**
     * @return the concept
     */
    public getCrossSection(): string {
        return this.cross;
    }

    /**
     * @param concept the concept to set
     */
    public setCrossSection(concept: string) {
        this.cross = concept;
    }

    /**
     * @return the value
     */
    public getValue(): string {
        return this.value;
    }

    /**
     * @param value the value to set
     */
    public setValue(value: string) {
        this.value = value;
    }

    /**
     * @return the concept
     */
    public getConcept(): string {
        return this.concept;
    }

    /**
     * @param concept the concept to set
     */
    public setConcept(concept: string) {
        this.concept = concept;
    }

    /**
     * @return the observationConcept
     */
    public getObservationConcept(): string {
        return this.observationConcept;
    }

    /**
     * @param observationConcept the observationConcept to set
     */
    public setObservationConcept(observationConcept: string) {
        this.observationConcept = observationConcept;
    }

    public toCubeObs(key: FullKey, mapper: interfaces.ColumnMapper): CubeObs {
        var f: CubeObs = new CubeObs(mapper);
        for (var i: number = 0; i < mapper.size(); i++) {
            var s: string = mapper.getColumnName(i);
            var v: string = key.getComponent(s);
            f.addValue(s, v);
        }
        // Cross Sectional Data
        
        if (this.concept != null) {f.addValue(this.concept, this.cross);}
        if (!mapper.containsColumn(this.observationConcept)) {mapper.registerColumn(this.observationConcept, AttachmentLevel.OBSERVATION);}
        f.addValue(this.observationConcept, this.value);
        for (var i: number = 0; i < this.map.keys().length; i++) {
            var s: string = this.map.keys()[i];
            var v2: CubeAttribute = this.map.getValue(s);
            if (!mapper.containsColumn(s)) {mapper.registerColumn(s, AttachmentLevel.OBSERVATION);}
            f.addValue(s, v2.getValue());
        }
        return f;
    }
    public toFlatObs(key: FullKey, mapper: interfaces.ColumnMapper): FlatObs {
        var f: FlatObs = new FlatObs([]);
        mapper.getObservationColumns().forEach(function (s: string) {
            var v = key.getComponent(s);
            f.setValue(mapper.getColumnIndex(s), v);
        });
        // Cross Sectional Data
        if (this.concept != null) {f.setValue(mapper.getColumnIndex(this.concept), this.cross);}
        // OBS_VALUE
        if (!mapper.containsColumn(this.observationConcept)) {mapper.registerColumn(this.observationConcept, AttachmentLevel.OBSERVATION);}
        f.setValue(mapper.getColumnIndex(this.observationConcept), this.value);
        this.map.forEach(function (at: string) {
            var ca: CubeAttribute = this.getAttribute(at);
            // Attributes
            f.setValue(mapper.getColumnIndex(ca.getConcept()), ca.getValue());
        }.bind(this));
        return f;
    }
}

export class CubeAttribute {
    private concept: string = null;
    private value: string = null;
    constructor(concept: string, value: string) {
        this.concept = concept;
        this.value = value;
    }
    public getConcept(): string {
        return this.concept;
    }
    public getValue(): string {
        return this.value;
    }
}

export class CubeObs {
    private mapper = null;
    private data = [];
    constructor(mapper:interfaces.ColumnMapper){
        this.mapper=mapper;
    }
    public addValue(c: string, v: string) {
        this.data[this.mapper.getColumnIndex(c)]=v;
    }
    public getValue(c:string) {
        return this.data[this.mapper.getColumnIndex(c)];
    }
    public toString() {
        var s = "";
        for(var i:number=0;i<this.mapper.size();i++) {
            s+=this.data[i];
            if(i<this.mapper.size()){
                s+=":";
            }
        }
        return s;
    }
}

