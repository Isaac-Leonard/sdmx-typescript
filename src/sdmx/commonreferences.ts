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
import * as xml from './xml';
export class Version extends xml.RegexXMLString {
  public static PATTERN: string = '[0-9]+(\\.[0-9]+)*';
  public static ONE: Version = new Version('1.0');
  constructor(s: string) {
    super(s);
  }
  public getPatternArray(): string[] {
    return [Version.PATTERN];
  }
  public equalsVersion(id: Version): boolean {
    return super.getString() == id.getString();
  }
  public equals(id: String): boolean {
    return super.getString() == id;
  }
  public compareTo(o: Object): number {
    if (!(o instanceof Version)) return -1;
    var a1: number = parseFloat(o.toString());
    var a2: number = parseFloat(toString());
    return a1 > a2 ? 1 : a1 < a2 ? -1 : 0;
  }
}
export class NestedID extends xml.RegexXMLString {
  public static PATTERN: string = '[A-z0-9_@$\\-]+(\\.[A-z0-9_@$\\-]+)*';

  constructor(s: string) {
    super(s);
  }

  public getPatternArray(): string[] {
    return [NestedID.PATTERN];
  }

  public equalsNestedID(id: NestedID): boolean {
    if (super.getString() == null) return false;
    return super.getString() == id.getString();
  }

  public equalsString(id: string): boolean {
    return super.equalsString(id);
  }

  public equalsID(id: ID): boolean {
    return super.getString() == id.getString();
  }

  public asID(): ID {
    return new ID(super.getString());
  }
}
export class ID extends NestedID {
  public static PATTERN: string = '[A-z0-9_@$\\-]+';

  constructor(s: string) {
    super(s);
    if (s == null) {
      throw new Error('null IDType string');
    }
  }

  public equalsID(id: ID): boolean {
    if (id == null) {
      //console.log("passed null id into ID.equalsID(...)");
      return false;
    }

    if (this.getString() == '') {
      console.log('this ID has a null string as ID');
      return false;
    }
    if (!id.getString) {
      console.log(id);
    }
    if (id.getString() == '') {
      console.log('hat ID has a null string in equalsID(...)');
      return false;
    }
    return this.getString() == id.getString();
  }
  public equalsString(id: string): boolean {
    return this.getString() == id;
  }
  public getPatternArray(): string[] {
    return [ID.PATTERN];
  }
}
export class NCNameID extends ID {
  public static PATTERN: string = '[A-z][A-z0-9_\\-]*';
  constructor(s: string) {
    super(s);
  }
  public getPatternArray(): Array<string> {
    return [NCNameID.PATTERN];
  }
  public equalsNCNameId(id: NCNameID): boolean {
    return super.getString() == id.getString();
  }
}
export class NestedNCNameID extends NestedID {
  public static PATTERN: string = '[A-z][A-z0-9_\\-]*(\\.[A-z][A-z0-9_\\-]*)*';

  constructor(s: string) {
    super(s);
  }
  public getPatternArray(): string[] {
    return [NestedNCNameID.PATTERN];
  }
  public equalsNestedNCNameID(id: NestedNCNameID): boolean {
    return super.getString() == id.getString();
  }
}
export class Ref {
  private agencyId: NestedNCNameID = null;
  private id: ID = null;
  private version: Version = null;
  private maintainedParentId: ID = null;
  private maintainedParentVersion: Version = null;
  private object: ObjectTypeCodelistType = null;
  private package: PackageTypeCodelistType = null;

  /*
        constructor(agencyId: NestedNCNameID, id: NestedID, vers: Version, maintParent: ID, mainVers: Version, containId: NestedID, loc: boolean, ob: ObjectTypeCodelistType, pack: PackageTypeCodelistType) {
            this.agencyId = agencyId;
            this.id = id;
            this.version = vers;
            this.maintainedParentId = maintParent;
            this.maintainedParentVersion = mainVers;
            this.local = loc;
            this.object = ob;
            this.package = pack;
        }
    */
  constructor() {}
  public getAgencyId(): NestedNCNameID {
    return this.agencyId;
  }
  public getId(): ID {
    return this.id;
  }
  public getVersion(): Version {
    return this.version;
  }
  public getMaintainableParentId(): ID {
    return this.maintainedParentId;
  }
  public getMaintainableParentVersion(): Version {
    return this.maintainedParentVersion;
  }
  public getRefClass(): ObjectTypeCodelistType {
    return this.object;
  }
  public getPack(): PackageTypeCodelistType {
    return this.package;
  }
  public setAgencyId(a: NestedNCNameID) {
    this.agencyId = a;
  }
  public setId(id: ID) {
    this.id = id;
  }
  public setVersion(v: Version) {
    this.version = v;
  }
  public setMaintainableParentId(id: ID) {
    this.maintainedParentId = id;
  }
  public setMaintainableParentVersion(v: Version) {
    this.maintainedParentVersion = v;
  }
  public setRefClass(ob: ObjectTypeCodelistType) {
    this.object = ob;
  }
  public setPackage(p: PackageTypeCodelistType) {
    this.package = p;
  }
  asReference(): Reference {
    var reference: Reference = new Reference(this, null);
    return reference;
  }
}
export class Reference {
  public urn: xml.anyURI;
  public ref: Ref;

  private pack: PackageTypeCodelistType = null;
  private clazz: ObjectTypeCodelistType = null;
  private agency: NestedNCNameID = null;
  private maintainedParentId: ID = null;
  private maintainedParentVersion: Version = null;
  private version: Version = null;
  private containedIds: Array<ID> = null;
  private objectId: NestedID = null;

  constructor(ref: Ref, urn: xml.anyURI) {
    this.ref = ref;
    this.urn = urn;
    if (this.ref != null) {
      //try {
      this.pack = ref.getPack();
      this.clazz = ref.getRefClass();
      this.agency = ref.getAgencyId();
      this.objectId = ref.getId();
      this.maintainedParentId = ref.getMaintainableParentId();
      this.maintainedParentVersion = ref.getMaintainableParentVersion();
      this.version = ref.getVersion();
      //} catch (URISyntaxException ex) {
      //    Logger.getLogger(ReferenceType.class.getName()).log(Level.SEVERE, null, ex);
      //}
    } else {
      this.parse();
    }
    if (this.urn == null) {
      try {
        //if (this.getAgencyId() != null) {
        this.produce();
        //}
      } catch (Error) {}
    }
  }

  /**
   * @return the ref
   */
  public getRef(): Ref {
    return this.ref;
  }

  /**
   * @param ref the ref to set
   */
  public setRef(ref: Ref) {
    this.ref = ref;
  }

  /**
   * @return the urn
   */
  public getUrn(): xml.anyURI {
    return this.urn;
  }

  /**
   * @param urn the urn to set
   */
  public setUrn(urn: xml.anyURI) {
    this.urn = urn;
  }

  /**
   * @return the pack
   */
  public getPack(): PackageTypeCodelistType {
    return this.pack;
  }
  public setPack(pack: PackageTypeCodelistType) {
    this.pack = pack;
  }

  /**
   * @return the clazz
   */
  public getRefClass(): ObjectTypeCodelistType {
    return this.clazz;
  }

  public setRefClass(clazz: ObjectTypeCodelistType) {
    this.clazz = clazz;
  }
  /**
   * @return the clazz
   */
  public getClazz(): ObjectTypeCodelistType {
    return this.clazz;
  }

  /**
   * @return the agency
   */
  public getAgencyId(): NestedNCNameID {
    return this.agency;
  }

  /**
   * @return the maintainedObjectId
   */
  public getMaintainableParentId(): ID {
    return this.maintainedParentId;
  }

  /**
   * @return the maintainedObjectVersion
   */
  public getVersion(): Version {
    return this.version;
  }

  /**
   * @return the objectId
   */
  public getId(): NestedID {
    return this.objectId;
  }

  public getContainedObjectIds(): Array<ID> {
    return this.containedIds;
  }

  /**
   * @return the maintainedParentVersion
   */
  public getMaintainedParentVersion(): Version {
    return this.maintainedParentVersion;
  }
  //public IDType getMainID() {
  //    if( this.maintainedParentId==null ) return objectId!=null?objectId.asID():null;
  //    else return maintainedParentId;
  //}

  public dump() {}

  public toString(): string {
    var s: string = '';
    return s;
  }
  public parse() {}
  public produce() {}
  public cloneRef(): Ref {
    var ref2 = new Ref();
    ref2.setAgencyId(this.agency);
    ref2.setId(this.getId().asID());
    ref2.setMaintainableParentId(this.maintainedParentId);
    ref2.setMaintainableParentVersion(this.maintainedParentVersion);
    ref2.setRefClass(this.clazz);
    ref2.setPackage(this.pack);
    ref2.setVersion(this.version);
    return ref2;
  }
}

export class ObjectTypeCodelistType {
  public static ENUM: Array<ObjectTypeCodelistType> = new Array<ObjectTypeCodelistType>();
  public static STRING_ENUM: Array<string> = new Array<string>();

  public static TARGET_ANY: string = ObjectTypeCodelistType.addString('Any');
  public static TARGET_AGENCY: string = ObjectTypeCodelistType.addString('Agency');

  public static TARGET_AGENCYSCHEME: string = ObjectTypeCodelistType.addString('AgencyScheme');
  public static TARGET_ATTACHMENTCONSTRAINT: string = ObjectTypeCodelistType.addString('AttachmentConstraint');
  public static TARGET_ATTRIBUTE: string = ObjectTypeCodelistType.addString('Attribute');
  public static TARGET_ATTRIBUTEDESCRIPTOR: string = ObjectTypeCodelistType.addString('AttributeDescriptor');
  public static TARGET_CATEGORISATION: string = ObjectTypeCodelistType.addString('Categorisation');
  public static TARGET_CATEGORY: string = ObjectTypeCodelistType.addString('Category');
  public static TARGET_CATEGORYSCHEMEMAP: string = ObjectTypeCodelistType.addString('CategorySchemeMap');
  public static TARGET_CATEGORYSCHEME: string = ObjectTypeCodelistType.addString('CategoryScheme');
  public static TARGET_CODE: string = ObjectTypeCodelistType.addString('Code');
  public static TARGET_CODEMAP: string = ObjectTypeCodelistType.addString('CodeMap');
  public static TARGET_CODELIST: string = ObjectTypeCodelistType.addString('Codelist');
  public static TARGET_CODELISTMAP: string = ObjectTypeCodelistType.addString('CodelistMap');
  public static TARGET_COMPONENTMAP: string = ObjectTypeCodelistType.addString('ComponentMap');
  public static TARGET_CONCEPT: string = ObjectTypeCodelistType.addString('Concept');
  public static TARGET_CONCEPTMAP: string = ObjectTypeCodelistType.addString('ConceptMap');
  public static TARGET_CONCEPTSCHEME: string = ObjectTypeCodelistType.addString('ConceptScheme');
  public static TARGET_CONCEPTSCHEMEMAP: string = ObjectTypeCodelistType.addString('ConceptSchemeMap');
  public static TARGET_CONSTRAINT: string = ObjectTypeCodelistType.addString('Constraint');
  public static TARGET_CONSTRAINTARGET: string = ObjectTypeCodelistType.addString('ConstraintTarget');
  public static TARGET_CONTENTCONSTRAINT: string = ObjectTypeCodelistType.addString('ContentConstraint');
  public static TARGET_DATAFLOW: string = ObjectTypeCodelistType.addString('Dataflow');
  public static TARGET_DATACONSUMER: string = ObjectTypeCodelistType.addString('DataConsumer');
  public static TARGET_DATACONSUMERSCHEME: string = ObjectTypeCodelistType.addString('DataConsumerScheme');
  public static TARGET_DATAPROVIDER: string = ObjectTypeCodelistType.addString('DataProvider');
  public static TARGET_DATAPROVIDERSCHEME: string = ObjectTypeCodelistType.addString('DataProviderScheme');
  public static TARGET_DATASETTARGET: string = ObjectTypeCodelistType.addString('DataSetTarget');
  public static TARGET_DATASTRUCTURE: string = ObjectTypeCodelistType.addString('DataStructure');
  public static TARGET_DIMENSION: string = ObjectTypeCodelistType.addString('Dimension');
  public static TARGET_DIMENSIONDESCRIPTOR: string = ObjectTypeCodelistType.addString('DimensionDescriptor');
  public static TARGET_DIMENSIONDESCRIPTORVALUESTARGET: string = ObjectTypeCodelistType.addString(
    'DimensionDescriptorValuesTarget',
  );
  public static TARGET_GROUPDIMENSIONDESCRIPTOR: string = ObjectTypeCodelistType.addString('GroupDimensionDescriptor');
  public static TARGET_HIERARCHICALCODE: string = ObjectTypeCodelistType.addString('HierarchicalCode');
  public static TARGET_HIERARCHICALCODELIST: string = ObjectTypeCodelistType.addString('HierarchicalCodelist');
  public static TARGET_HIERARCHY: string = ObjectTypeCodelistType.addString('Hierarchy');
  public static TARGET_HYBRIDCODELISTMAP: string = ObjectTypeCodelistType.addString('HybridCodelistMap');
  public static TARGET_HYBRIDCODEMAP: string = ObjectTypeCodelistType.addString('HybridCodeMap');
  public static TARGET_IDENTIFIABLEOBJECTTARGET: string = ObjectTypeCodelistType.addString('IdentifiableObjectTarget');
  public static TARGET_LEVEL: string = ObjectTypeCodelistType.addString('Level');
  public static TARGET_MEASUREDESCRIPTOR: string = ObjectTypeCodelistType.addString('MeasureDescriptor');
  public static TARGET_MEASUREDIMENSION: string = ObjectTypeCodelistType.addString('MeasureDimension');
  public static TARGET_METADATAFLOW: string = ObjectTypeCodelistType.addString('Metadataflow');
  public static TARGET_METADATAATTRIBUTE: string = ObjectTypeCodelistType.addString('MetadataAttribute');
  public static TARGET_METADATASET: string = ObjectTypeCodelistType.addString('MetadataSet');
  public static TARGET_METADATASTRUCTURE: string = ObjectTypeCodelistType.addString('MetadataStructure');
  public static TARGET_METADATATARGET: string = ObjectTypeCodelistType.addString('MetadataTarget');
  public static TARGET_ORGANISATION: string = ObjectTypeCodelistType.addString('Organisation');
  public static TARGET_ORGANISATIONMAP: string = ObjectTypeCodelistType.addString('OrganisationMap');
  public static TARGET_ORGANISATIONSCHEME: string = ObjectTypeCodelistType.addString('OrganisationScheme');
  public static TARGET_ORGANISATIONSCHEMEMAP: string = ObjectTypeCodelistType.addString('OrganisationSchemeMap');
  public static TARGET_ORGANISATIONUNIT: string = ObjectTypeCodelistType.addString('OrganisationUnit');
  public static TARGET_ORGANISATIONUNITSCHEME: string = ObjectTypeCodelistType.addString('OrganisationUnitScheme');
  public static TARGET_PRIMARYMEASURE: string = ObjectTypeCodelistType.addString('PrimaryMeasure');
  public static TARGET_PROCESS: string = ObjectTypeCodelistType.addString('Process');
  public static TARGET_PROCESSSTEP: string = ObjectTypeCodelistType.addString('ProcessStep');
  public static TARGET_PROVISIONAGREEMENT: string = ObjectTypeCodelistType.addString('ProvisionAgreement');
  public static TARGET_REPORTINGCATEGORY: string = ObjectTypeCodelistType.addString('ReportingCategory');
  public static TARGET_REPORTINGCATEGORYMAP: string = ObjectTypeCodelistType.addString('ReportingCategoryMap');
  public static TARGET_REPORTINGTAXONOMY: string = ObjectTypeCodelistType.addString('ReportingTaxonomy');
  public static TARGET_REPORTINGTAXONOMYMAP: string = ObjectTypeCodelistType.addString('ReportingTaxonomyMap');
  public static TARGET_REPORTINGYEARSTARTDAY: string = ObjectTypeCodelistType.addString('ReportingYearStartDay');
  public static TARGET_REPORTPERIODTARGET: string = ObjectTypeCodelistType.addString('ReportPeriodTarget');
  public static TARGET_REPORTSTRUCTURE: string = ObjectTypeCodelistType.addString('ReportStructure');
  public static TARGET_STRUCTUREMAP: string = ObjectTypeCodelistType.addString('StructureMap');
  public static TARGET_STRUCTURESET: string = ObjectTypeCodelistType.addString('StructureSet');
  public static TARGET_TIMEDIMENSION: string = ObjectTypeCodelistType.addString('TimeDimension');
  public static TARGET_TRANSITION: string = ObjectTypeCodelistType.addString('Transition');

  public static ANY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_ANY);
  public static AGENCY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_AGENCY);
  public static AGENCYSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_AGENCYSCHEME,
  );
  public static ATTACHMENTCONSTRAINT: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ATTACHMENTCONSTRAINT,
  );
  public static ATTRIBUTE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_ATTRIBUTE);
  public static ATTRIBUTEDESCRIPTOR: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ATTRIBUTEDESCRIPTOR,
  );
  public static CATEGORISATION: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CATEGORISATION,
  );
  public static CATEGORY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_CATEGORY);
  public static CATEGORYSCHEMEMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CATEGORYSCHEMEMAP,
  );
  public static CATEGORYSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CATEGORYSCHEME,
  );
  public static CODE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_CODE);
  public static CODEMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_CODE);
  public static CODELIST: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_CODELIST);
  public static CODELISTMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CODELISTMAP,
  );
  public static COMPONENTMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_COMPONENTMAP,
  );
  public static CONCEPT: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_CONCEPT);
  public static CONCEPTMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CONCEPTMAP,
  );
  public static CONCEPTSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CONCEPTSCHEME,
  );
  public static CONCEPTSCHEMEMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CONCEPTSCHEMEMAP,
  );
  public static CONSTRAINT: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CONSTRAINT,
  );
  public static CONSTRAINTARGET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CONSTRAINTARGET,
  );
  public static CONTENTCONSTRAINT: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_CONTENTCONSTRAINT,
  );
  public static DATAFLOW: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_DATAFLOW);
  public static DATACONSUMER: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DATACONSUMER,
  );
  public static DATACONSUMERSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DATACONSUMERSCHEME,
  );
  public static DATAPROVIDER: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DATAPROVIDER,
  );
  public static DATAPROVIDERSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DATAPROVIDERSCHEME,
  );
  public static DATASETTARGET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DATASETTARGET,
  );
  public static DATASTRUCTURE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DATASTRUCTURE,
  );
  public static DIMENSION: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_DIMENSION);
  public static DIMENSIONDESCRIPTOR: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DIMENSIONDESCRIPTOR,
  );
  public static DIMENSIONDESCRIPTORVALUESTARGET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_DIMENSIONDESCRIPTORVALUESTARGET,
  );
  public static GROUPDIMENSIONDESCRIPTOR: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_GROUPDIMENSIONDESCRIPTOR,
  );
  public static HIERARCHICALCODE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_HIERARCHICALCODE,
  );
  public static HIERARCHICALCODELIST: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_HIERARCHICALCODELIST,
  );
  public static HIERARCHY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_HIERARCHY);
  public static HYBRIDCODELISTMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_HYBRIDCODELISTMAP,
  );
  public static HYBRIDCODEMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_HYBRIDCODEMAP,
  );
  public static IDENTIFIABLEOBJECTTARGET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_IDENTIFIABLEOBJECTTARGET,
  );
  public static LEVEL: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_LEVEL);
  public static MEASUREDESCRIPTOR: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_MEASUREDESCRIPTOR,
  );
  public static MEASUREDIMENSION: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_MEASUREDIMENSION,
  );
  public static METADATAFLOW: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_METADATAFLOW,
  );
  public static METADATAATTRIBUTE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_METADATAATTRIBUTE,
  );
  public static METADATASET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_METADATASET,
  );
  public static METADATASTRUCTURE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_METADATASTRUCTURE,
  );
  public static METADATATARGET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_METADATATARGET,
  );
  public static ORGANISATION: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ORGANISATION,
  );
  public static ORGANISATIONMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ORGANISATIONMAP,
  );
  public static ORGANISATIONSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ORGANISATIONSCHEME,
  );
  public static ORGANISATIONSCHEMEMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ORGANISATIONSCHEMEMAP,
  );
  public static ORGANISATIONUNIT: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ORGANISATIONUNIT,
  );
  public static ORGANISATIONUNITSCHEME: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_ORGANISATIONUNITSCHEME,
  );
  public static PRIMARYMEASURE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_PRIMARYMEASURE,
  );
  public static PROCESS: ObjectTypeCodelistType = ObjectTypeCodelistType.add(ObjectTypeCodelistType.TARGET_PROCESS);
  public static PROCESSSTEP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_PROCESSSTEP,
  );
  public static PROVISIONAGREEMENT: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_PROVISIONAGREEMENT,
  );
  public static REPORTINGCATEGORY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTINGCATEGORY,
  );
  public static REPORTINGCATEGORYMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTINGCATEGORYMAP,
  );
  public static REPORTINGTAXONOMY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTINGTAXONOMY,
  );
  public static REPORTINGTAXONOMYMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTINGTAXONOMYMAP,
  );
  public static REPORTINGYEARSTARTDAY: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTINGYEARSTARTDAY,
  );
  public static REPORTPERIODTARGET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTPERIODTARGET,
  );
  public static REPORTSTRUCTURE: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_REPORTSTRUCTURE,
  );
  public static STRUCTUREMAP: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_STRUCTUREMAP,
  );
  public static STRUCTURESET: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_STRUCTURESET,
  );
  public static TIMEDIMENSION: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_TIMEDIMENSION,
  );
  public static TRANSITION: ObjectTypeCodelistType = ObjectTypeCodelistType.add(
    ObjectTypeCodelistType.TARGET_TRANSITION,
  );

  public static INT_ANY: number = 0;
  public static INT_AGENCY: number = 1;
  public static INT_AGENCYSCHEME: number = 2;
  public static INT_ATTACHMENTCONSTRAINT: number = 3;
  public static INT_ATTRIBUTE: number = 4;
  public static INT_ATTRIBUTEDESCRIPTOR: number = 5;
  public static INT_CATEGORISATION: number = 6;
  public static INT_CATEGORY: number = 7;
  public static INT_CATEGORYSCHEMEMAP: number = 8;
  public static INT_CATEGORYSCHEME: number = 9;
  public static INT_CODE: number = 10;
  public static INT_CODEMAP: number = 11;
  public static INT_CODELIST: number = 12;
  public static INT_CODELISTMAP: number = 13;
  public static INT_COMPONENTMAP: number = 14;
  public static INT_CONCEPT: number = 15;
  public static INT_CONCEPTMAP: number = 16;
  public static INT_CONCEPTSCHEME: number = 17;
  public static INT_CONCEPTSCHEMEMAP: number = 18;
  public static INT_CONSTRAINT: number = 19;
  public static INT_CONSTRAINTARGET: number = 20;
  public static INT_CONTENTCONSTRAINT: number = 21;
  public static INT_DATAFLOW: number = 22;
  public static INT_DATACONSUMER: number = 23;
  public static INT_DATACONSUMERSCHEME: number = 24;
  public static INT_DATAPROVIDER: number = 25;
  public static INT_DATAPROVIDERSCHEME: number = 26;
  public static INT_DATASETTARGET: number = 27;
  public static INT_DATASTRUCTURE: number = 28;
  public static INT_DIMENSION: number = 29;
  public static INT_DIMENSIONDESCRIPTOR: number = 30;
  public static INT_DIMENSIONDESCRIPTORVALUESTARGET: number = 31;
  public static INT_GROUPDIMENSIONDESCRIPTOR: number = 32;
  public static INT_HIERARCHICALCODE: number = 33;
  public static INT_HIERARCHICALCODELIST: number = 34;
  public static INT_HIERARCHY: number = 35;
  public static INT_HYBRIDCODELISTMAP: number = 36;
  public static INT_HYBRIDCODEMAP: number = 37;
  public static INT_IDENTIFIABLEOBJECTTARGET: number = 38;
  public static INT_LEVEL: number = 39;
  public static INT_MEASUREDESCRIPTOR: number = 40;
  public static INT_MEASUREDIMENSION: number = 41;
  public static INT_METADATAFLOW: number = 42;
  public static INT_METADATAATTRIBUTE: number = 43;
  public static INT_METADATASET: number = 44;
  public static INT_METADATASTRUCTURE: number = 45;
  public static INT_METADATATARGET: number = 46;
  public static INT_ORGANISATION: number = 47;
  public static INT_ORGANISATIONMAP: number = 48;
  public static INT_ORGANISATIONSCHEME: number = 49;
  public static INT_ORGANISATIONSCHEMEMAP: number = 50;
  public static INT_ORGANISATIONUNIT: number = 51;
  public static INT_ORGANISATIONUNITSCHEME: number = 52;
  public static INT_PRIMARYMEASURE: number = 53;
  public static INT_PROCESS: number = 54;
  public static INT_PROCESSSTEP: number = 55;
  public static INT_PROVISIONAGREEMENT: number = 56;
  public static INT_REPORTINGCATEGORY: number = 57;
  public static INT_REPORTINGCATEGORYMAP: number = 58;
  public static INT_REPORTINGTAXONOMY: number = 59;
  public static INT_REPORTINGTAXONOMYMAP: number = 60;
  public static INT_REPORTINGYEARSTARTDAY: number = 61;
  public static INT_REPORTPERIODTARGET: number = 62;
  public static INT_REPORTSTRUCTURE: number = 63;
  public static INT_STRUCTUREMAP: number = 64;
  public static INT_STRUCTURESET: number = 65;
  public static INT_TIMEDIMENSION: number = 66;
  public static INT_TRANSITION: number = 67;

  // Utility
  private static add(s: string): ObjectTypeCodelistType {
    var b: ObjectTypeCodelistType = new ObjectTypeCodelistType(s);
    ObjectTypeCodelistType.ENUM.push(b);
    return b;
  }
  private static addString(s: string): string {
    ObjectTypeCodelistType.STRING_ENUM.push(s);
    return s;
  }

  public static fromString(s: string): ObjectTypeCodelistType {
    for (var i: number = 0; i < ObjectTypeCodelistType.ENUM.length; i++) {
      if (ObjectTypeCodelistType.ENUM[i].target == s) return ObjectTypeCodelistType.ENUM[i];
    }
    return null;
  }
  public static fromStringWithException(s: string): ObjectTypeCodelistType {
    for (var i: number = 0; i < ObjectTypeCodelistType.ENUM.length; i++) {
      if (ObjectTypeCodelistType.ENUM[i].target == s) return ObjectTypeCodelistType.ENUM[i];
    }
    throw new Error('Value:' + s + ' not found in enumeration! - ObjectypeCodelistType');
  }
  // Instance
  private target: string = null;
  private index: number = -1;
  public constructor(s: string) {
    var contains: boolean = false;
    for (var i = 0; i < ObjectTypeCodelistType.STRING_ENUM.length; i++) {
      if (ObjectTypeCodelistType.STRING_ENUM[i] == s) {
        contains = true;
      }
    }
    if (!contains) throw new Error(s + ' is not a valid CodeTypeCodelistType');
    this.target = s;
    this.index = ObjectTypeCodelistType.STRING_ENUM.indexOf(s);
  }
  public toString(): string {
    return this.target;
  }
  public toInt(): number {
    return this.index;
  }
}

export class PackageTypeCodelistType {
  public static ENUM: Array<PackageTypeCodelistType> = new Array<PackageTypeCodelistType>();
  public static STRING_ENUM: Array<string> = new Array<string>();

  public static TARGET_BASE: string = PackageTypeCodelistType.addString('base');
  public static TARGET_DATASTRUCTURE: string = PackageTypeCodelistType.addString('datastructure');
  public static TARGET_METADATASTRUCTURE: string = PackageTypeCodelistType.addString('metadatastructure');
  public static TARGET_PROCESS: string = PackageTypeCodelistType.addString('process');
  public static TARGET_REGISTRY: string = PackageTypeCodelistType.addString('registry');
  public static TARGET_MAPPING: string = PackageTypeCodelistType.addString('mapping');
  public static TARGET_CODELIST: string = PackageTypeCodelistType.addString('codelist');
  public static TARGET_CATEGORYSCHEME: string = PackageTypeCodelistType.addString('categoryscheme');
  public static TARGET_CONCEPTSCHEME: string = PackageTypeCodelistType.addString('conceptscheme');

  public static BASE: PackageTypeCodelistType = PackageTypeCodelistType.add(PackageTypeCodelistType.TARGET_BASE);
  public static DATASTRUCTURE: PackageTypeCodelistType = PackageTypeCodelistType.add(
    PackageTypeCodelistType.TARGET_DATASTRUCTURE,
  );
  public static METADATASTRUCTURE: PackageTypeCodelistType = PackageTypeCodelistType.add(
    PackageTypeCodelistType.TARGET_METADATASTRUCTURE,
  );
  public static PROCESS: PackageTypeCodelistType = PackageTypeCodelistType.add(PackageTypeCodelistType.TARGET_PROCESS);
  public static REGISTRY: PackageTypeCodelistType = PackageTypeCodelistType.add(
    PackageTypeCodelistType.TARGET_REGISTRY,
  );
  public static MAPPING: PackageTypeCodelistType = PackageTypeCodelistType.add(PackageTypeCodelistType.TARGET_MAPPING);
  public static CODELIST: PackageTypeCodelistType = PackageTypeCodelistType.add(
    PackageTypeCodelistType.TARGET_CODELIST,
  );
  public static CATEGORYSCHEME: PackageTypeCodelistType = PackageTypeCodelistType.add(
    PackageTypeCodelistType.TARGET_CATEGORYSCHEME,
  );
  public static CONCEPTSCHEME: PackageTypeCodelistType = PackageTypeCodelistType.add(
    PackageTypeCodelistType.TARGET_CONCEPTSCHEME,
  );
  // Utility
  private static add(s: string): PackageTypeCodelistType {
    var b: PackageTypeCodelistType = new PackageTypeCodelistType(s);
    PackageTypeCodelistType.ENUM.push(b);
    return b;
  }
  private static addString(s: string): string {
    PackageTypeCodelistType.STRING_ENUM.push(s);
    return s;
  }

  public static fromString(s: string): PackageTypeCodelistType {
    for (var i = 0; i < PackageTypeCodelistType.ENUM.length; i++) {
      if (PackageTypeCodelistType.ENUM[i].target == s) return PackageTypeCodelistType.ENUM[i];
    }
    return null;
  }
  public static fromStringWithException(s: string): PackageTypeCodelistType {
    for (var i = 0; i < PackageTypeCodelistType.ENUM.length; i++) {
      if (PackageTypeCodelistType.ENUM[i].target == s) return PackageTypeCodelistType.ENUM[i];
    }
    throw new Error('Value:' + s + ' not found in PackageTypeCodelistType enumeration!');
  }
  // Instance
  private target: string = null;
  constructor(s: string) {
    var contains: boolean = false;
    for (var i = 0; i < PackageTypeCodelistType.STRING_ENUM.length; i++) {
      if (PackageTypeCodelistType.STRING_ENUM[i] == s) {
        contains = true;
      }
    }
    if (!contains) throw new Error(s + ' is not a valid CodeTypeCodelistType');
    this.target = s;
  }
  public toString(): string {
    return this.target;
  }
}

export class ObsDimensionsCodeType {
  /*
   * DO ME! Add Proper codes for this class
   *
   *
   */
  public static ENUM: Array<ObsDimensionsCodeType> = new Array<ObsDimensionsCodeType>();
  public static STRING_ENUM: Array<string> = new Array<string>();

  public static ALL_DIMENSIONS_TEXT: string = ObsDimensionsCodeType.addString('AllDimensions');
  public static TIME_PERIOD_TEXT: string = ObsDimensionsCodeType.addString('TIME_PERIOD');
  public static ALL_DIMENSIONS: ObsDimensionsCodeType = new ObsDimensionsCodeType(
    ObsDimensionsCodeType.ALL_DIMENSIONS_TEXT,
  );
  public static TIME_PERIOD: ObsDimensionsCodeType = new ObsDimensionsCodeType(ObsDimensionsCodeType.TIME_PERIOD_TEXT);
  // Utility
  private static add(s: string): ObsDimensionsCodeType {
    var b: ObsDimensionsCodeType = new ObsDimensionsCodeType(s);
    ObsDimensionsCodeType.ENUM.push(b);
    return b;
  }
  private static addString(s: string): string {
    ObsDimensionsCodeType.STRING_ENUM.push(s);
    return s;
  }

  public static fromString(s: string): ObsDimensionsCodeType {
    for (var i = 0; i < ObsDimensionsCodeType.ENUM.length; i++) {
      if (ObsDimensionsCodeType.ENUM[i].target == s) return ObsDimensionsCodeType.ENUM[i];
    }
    return null;
  }
  public static fromStringWithException(s: string): ObsDimensionsCodeType {
    for (var i = 0; i < ObsDimensionsCodeType.ENUM.length; i++) {
      if (ObsDimensionsCodeType.ENUM[i].target == s) return ObsDimensionsCodeType.ENUM[i];
    }
    throw new Error('Value:' + s + ' not found in ObsDimensionCodeType enumeration!');
  }
  // Instance
  private target: string = null;
  constructor(s: string) {
    var contains: boolean = false;
    for (var i = 0; i < ObsDimensionsCodeType.STRING_ENUM.length; i++) {
      if (ObsDimensionsCodeType.STRING_ENUM[i] == s) {
        contains = true;
      }
    }
    if (!contains) throw new Error(s + ' is not a valid ObsDimensionsCodeType');
    this.target = s;
  }
  public toString(): string {
    return this.target;
  }
}
export class ProvisionAgreementReference {}
export class StructureReferenceBase {}
export class StructureUsageReferenceBase {}

export default {
  ID: ID,
  NCNameID: NCNameID,
  NestedID: NestedID,
  NestedNCNameID: NestedNCNameID,
  ObjectTypeCodelistType: ObjectTypeCodelistType,
  ObsDimensionsCodeType: ObsDimensionsCodeType,
  PackageTypeCodelistType: PackageTypeCodelistType,
  ProvisionAgreementReference: ProvisionAgreementReference,
  Ref: Ref,
  Reference: Reference,
  StructureReferenceBase: StructureReferenceBase,
  StructureUsageReferenceBase: StructureUsageReferenceBase,
  Version: Version,
};
