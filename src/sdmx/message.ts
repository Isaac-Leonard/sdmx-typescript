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

import * as collections from 'typescript-collections';
import * as common from '../sdmx/common';
import * as commonreferences from '../sdmx/commonreferences';
import * as data from '../sdmx/data';
import * as interfaces from '../sdmx/interfaces';
import * as structure from '../sdmx/structure';
//import * as sdmx from '../sdmx';
import * as xml from '../sdmx/xml';
export class DataMessage {
  private header: Header = null;
  private dataSets: Array<data.FlatDataSet> = [];

  constructor() {}

  getHeader() {
    return this.header;
  }
  setHeader(h: Header) {
    this.header = h;
  }
  getDataSet(i: number): data.FlatDataSet {
    return this.dataSets[i];
  }
  setDataSet(i: number, ds: data.FlatDataSet) {
    this.dataSets[i] = ds;
  }
  addDataSet(ds: data.FlatDataSet): number {
    this.dataSets.push(ds);
    return collections.arrays.indexOf(this.dataSets, ds);
  }
  removeDataSet(ds: data.FlatDataSet) {
    collections.arrays.remove(this.dataSets, ds);
  }
  size(): number {
    return this.dataSets.length;
  }
}

export class DataQuery {}
export class StructureType implements interfaces.LocalRegistry {
  private header: Header = null;
  private structures: structure.Structures = null;

  constructor() {}
  getHeader() {
    return this.header;
  }
  setHeader(h: Header) {
    this.header = h;
  }
  getStructures() {
    return this.structures;
  }
  setStructures(s: structure.Structures) {
    this.structures = s;
  }
  // Registry
  listDataflows(): Array<structure.Dataflow> {
    return this.structures.listDataflows();
  }
  clear(): void {}
  load(struct: StructureType): void {}
  unload(struct: StructureType): void {}
  findDataStructure(ref: commonreferences.Reference): structure.DataStructure {
    return this.structures.findDataStructure(ref);
  }
  findDataflow(ref: commonreferences.Reference): structure.Dataflow {
    return this.structures.findDataflow(ref);
  }
  findCode(ref: commonreferences.Reference): structure.CodeType {
    return this.structures.findCode(ref);
  }
  findCodelist(ref: commonreferences.Reference): structure.Codelist {
    return this.structures.findCodelist(ref);
  }
  findItemType(item: commonreferences.Reference): structure.ItemType {
    return this.structures.findItemType(item);
  }
  findConcept(ref: commonreferences.Reference): structure.ConceptType {
    return this.structures.findConcept(ref);
  }
  findConceptScheme(ref: commonreferences.Reference): structure.ConceptSchemeType {
    return this.structures.findConceptScheme(ref);
  }
  searchDataStructure(ref: commonreferences.Reference): Array<structure.DataStructure> {
    return this.structures.searchDataStructure(ref);
  }
  searchDataflow(ref: commonreferences.Reference): Array<structure.Dataflow> {
    return this.structures.searchDataflow(ref);
  }
  searchCodelist(ref: commonreferences.Reference): Array<structure.Codelist> {
    return this.structures.searchCodelist(ref);
  }
  searchItemType(item: commonreferences.Reference): Array<structure.ItemType> {
    return this.structures.searchItemType(item);
  }
  searchConcept(ref: commonreferences.Reference): Array<structure.ConceptType> {
    return this.structures.searchConcept(ref);
  }
  searchConceptScheme(ref: commonreferences.Reference): Array<structure.ConceptSchemeType> {
    return this.structures.searchConceptScheme(ref);
  }
  save(): any {}
}
export class HeaderTimeType {
  private date: xml.DateTime = null;
  constructor(d: xml.DateTime) {
    this.date = d;
  }
  getDate(): xml.DateTime {
    return this.date;
  }
  setDate(d: xml.DateTime): void {
    this.date = d;
  }
}
export class Contact {
  public name: Array<common.Name> = [];
  public departments: Array<common.TextType> = [];
  public roles: Array<common.TextType> = [];
  public telephones: Array<string> = [];
  public faxes: Array<string> = [];
  public z400s: Array<string> = [];
  public uris: Array<xml.anyURI> = [];
  public emails: Array<string> = [];
}
export class PartyType extends structure.NameableType {
  public contacts: Array<Contact> = [];
  constructor() {
    super();
  }
}
export class Sender extends PartyType {
  constructor() {
    super();
  }
}

export class Header {
  private id: string = null;
  private test: boolean = null;
  private prepared: HeaderTimeType = null;
  private sender: PartyType = null;
  private receivers: Array<PartyType> = [];
  private names: Array<common.Name> = [];
  private structures: Array<common.PayloadStructureType> = [];
  private dataproviderReference: commonreferences.Reference = null;
  private dataSetAction: common.ActionType = null;
  private dataSetId: Array<commonreferences.ID> = [];
  private extracted: xml.DateTime = null;
  private reportingBegin: common.ObservationalTimePeriodType = null;
  private reportingEnd: common.ObservationalTimePeriodType = null;
  private embargoDate: xml.DateTime = null;
  private source: Array<common.Name> = [];

  constructor() {}

  getId(): string {
    return this.id;
  }
  setId(s: string) {
    this.id = s;
  }
  getTest(): boolean {
    return this.test;
  }
  setTest(b: boolean) {
    this.test = b;
  }
  getPrepared(): HeaderTimeType {
    return this.prepared;
  }
  setPrepared(h: HeaderTimeType) {
    this.prepared = h;
  }
  getSender(): Sender {
    return this.sender;
  }
  setSender(p: Sender) {
    this.sender = p;
  }
  getReceivers(): Array<PartyType> {
    return this.receivers;
  }
  setReceivers(recs: Array<PartyType>) {
    this.receivers = recs;
  }
  getNames(): Array<common.Name> {
    return this.names;
  }
  setNames(n: Array<common.Name>) {
    this.names = n;
  }
  setStructures(pl: Array<common.PayloadStructureType>) {
    this.structures = pl;
  }
  getStructures(): Array<common.PayloadStructureType> {
    return this.structures;
  }
  getDataproviderReference(): commonreferences.Reference {
    return this.dataproviderReference;
  }
  setDataproviderReference(ref: commonreferences.Reference) {
    this.dataproviderReference = ref;
  }
  setAction(ac: common.ActionType) {
    this.dataSetAction = ac;
  }
  getAction(): common.ActionType {
    return this.dataSetAction;
  }
  getDataSetId(): Array<commonreferences.ID> {
    return this.dataSetId;
  }
  setDataSetId(ids: Array<commonreferences.ID>) {
    this.dataSetId = ids;
  }
  getExtracted(): xml.DateTime {
    return this.extracted;
  }
  setExtracted(d: xml.DateTime) {
    this.extracted = d;
  }
  getReportingBegin(): common.ObservationalTimePeriodType {
    return this.reportingBegin;
  }
  setReportingBegin(o: common.ObservationalTimePeriodType) {
    this.reportingBegin = o;
  }
  getReportingEnd(): common.ObservationalTimePeriodType {
    return this.reportingEnd;
  }
  setReportingEnd(o: common.ObservationalTimePeriodType) {
    this.reportingEnd = o;
  }
  getEmbargoDate(): xml.DateTime {
    return this.embargoDate;
  }
  setEmbargoDate(dt: xml.DateTime) {
    this.embargoDate = dt;
  }
  getSource(): Array<common.Name> {
    return this.source;
  }
  setSource(s: Array<common.Name>) {
    this.source = s;
  }
}

export default {
  Contact: Contact,
  DataMessage: DataMessage,
  DataQuery: DataQuery,
  Header: Header,
  HeaderTimeType: HeaderTimeType,
  PartyType: PartyType,
  Sender: Sender,
  StructureType: StructureType,
};
