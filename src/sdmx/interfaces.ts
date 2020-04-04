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
import { Promise } from 'bluebird';
import * as message from '../sdmx/message';
import * as commonreferences from '../sdmx/commonreferences';
import * as structure from '../sdmx/structure';
import * as data from '../sdmx/data';

export interface Queryable {
    getRemoteRegistry(): RemoteRegistry;
    getRepository(): Repository;
    getDataService():string
}
/*
 * Sometimes i feel that i dont like the way this class works in javascript...
 * really i would like only one 'Registry' interface, whether they return promises
 * or concrete objects doesn't really matter just as long as there is only one
 * type of Registry interface, and i think Promises fit in better with javascript...
 * the only reason this class returns concrete objects, is because I need it for
 * sdmx 2.0 parsing to access the codelists and conceptschemes while parsing the
 * document.
 */
export interface LocalRegistry {
    // Registry
    listDataflows(): Array<structure.Dataflow>;
    clear(): void;
    load(struct: message.StructureType): void;
    unload(struct: message.StructureType): void;
    findDataStructure(ref: commonreferences.Reference): structure.DataStructure;
    findDataflow(ref: commonreferences.Reference): structure.Dataflow;
    findCode(ref: commonreferences.Reference): structure.CodeType;
    findCodelist(ref: commonreferences.Reference): structure.Codelist;
    findItemType(item: commonreferences.Reference): structure.ItemType;
    findConcept(ref: commonreferences.Reference): structure.ConceptType;
    findConceptScheme(ref: commonreferences.Reference): structure.ConceptSchemeType;
    searchDataStructure(ref: commonreferences.Reference): Array<structure.DataStructure>;
    searchDataflow(ref: commonreferences.Reference): Array<structure.Dataflow>;
    searchCodelist(ref: commonreferences.Reference): Array<structure.Codelist>;
    searchItemType(item: commonreferences.Reference): Array<structure.ItemType>;
    searchConcept(ref: commonreferences.Reference): Array<structure.ConceptType>;
    searchConceptScheme(ref: commonreferences.Reference): Array<structure.ConceptSchemeType>;
    save(): any;

}
export interface RemoteRegistry {
    // Registry
    listDataflows(): Promise<Array<structure.Dataflow>>;
    clear(): void;
    load(struct: message.StructureType): void;
    unload(struct: message.StructureType): void;
/*
 * Typically, a call to findDataStructure, should load the datastructure, and all child 
 * references into the LocalRegistry...
 * or at least, i usually assume that after a call to findDataStructure, the required 
 * codelists and conceptschemes have been loaded into LocalRegistry.
 */
    findDataStructure(ref: commonreferences.Reference): Promise<structure.DataStructure>;
    findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow>;
    findCode(ref: commonreferences.Reference): Promise<structure.CodeType>;
    findCodelist(ref: commonreferences.Reference): Promise<structure.Codelist>;
    findItemType(item: commonreferences.Reference): Promise<structure.ItemType>;
    findConcept(ref: commonreferences.Reference): Promise<structure.ConceptType>;
    findConceptScheme(ref: commonreferences.Reference): Promise<structure.ConceptSchemeType>;
    searchDataStructure(ref: commonreferences.Reference): Promise<Array<structure.DataStructure>>;
    searchDataflow(ref: commonreferences.Reference): Promise<Array<structure.Dataflow>>;
    searchCodelist(ref: commonreferences.Reference): Promise<Array<structure.Codelist>>;
    searchItemType(item: commonreferences.Reference): Promise<Array<structure.ItemType>>;
    searchConcept(ref: commonreferences.Reference): Promise<Array<structure.ConceptType>>;
    searchConceptScheme(ref: commonreferences.Reference): Promise<Array<structure.ConceptSchemeType>>;
    getLocalRegistry():LocalRegistry;
    save(): any;

}

export interface Repository {
    query(query: data.Query): Promise<message.DataMessage>;
}
export interface SdmxParserProvider {
    getVersionIdentifier(): number;
    canParse(header: string): boolean;
    isStructure(header: string): boolean;
    isData(header: string): boolean;
    isMetadata(header: string): boolean;
    parseStructure(input: string): message.StructureType;
    parseStructureWithRegistry(input: string,reg:LocalRegistry): message.StructureType;
    parseData(input: string): message.DataMessage;
}
export interface Attachable {
    getValue(s: string): string;
    setValue(s: string, val: string);
    getAttachmentLevel(): data.AttachmentLevel;
    getValue(i: number): string;
    setValue(i: number, val: string);
}
export interface ColumnMapper {
    registerColumn(s: string, attach: data.AttachmentLevel): number;
    getColumnIndex(s: string): number;
    getColumnName(i: number): string;
    size(): number;
    containsColumn(name: string): boolean;
    getObservationColumns(): Array<string>;
    getSeriesColumns(): Array<string>;
    getDataSetColumns(): Array<string>;
    getGroupColumns(): Array<string>;
    isAttachedToDataSetString(s: string): boolean;
    isAttachedToDataSetInt(i: number): boolean;
    isAttachedToSeriesString(s: string): boolean;
    isAttachedToSeriesInt(i: number): boolean;
    isAttachedToObservationString(s: string): boolean;
    isAttachedToObservationInt(i: number): boolean;
    isAttachedToGroupString(s: string): boolean;
    isAttachedToGroupInt(i: number): boolean;
    dump();
}
export interface DataSetWriter {
    //public ColumnMapper getColumnMapper();
    newDataSet();
    newSeries();
    newObservation();
    writeDataSetComponent(name: string, val: string);
    writeSeriesComponent(name: string, val: string);
    writeObservationComponent(name: string, val: string);
    writeGroupValues(name: string, group: collections.Dictionary<string, Object>);
    finishObservation();
    finishSeries();
    finishDataSet(): DataSet;
}

export interface DataSet {
    dump();
    getColumnName(i: number): string;
    getColumnIndex(s: string): number;
    getColumnSize(): number;
    size(): number;
    getValue(row: number, col: number);
    setValue(row: number, col: number, val: string);
    getFlatObs(row: number): data.FlatObs;
    query(cube: data.Cube, order: Array<string>): data.Cube;
    getColumnMapper(): ColumnMapper;
    setGroups(groups: Array<data.Group>);
    getGroups(): Array<data.Group>;
    groupSize(): number;
    find(key: data.FullKey): data.FlatObs;
}