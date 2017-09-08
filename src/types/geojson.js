const GeoJSON = (graphql, name) => {
  const {
    GraphQLFloat,
    GraphQLList,
    GraphQLEnumType,
    GraphQLObjectType,
    GraphQLScalarType,
    GraphQLNonNull
  } = graphql;

  const TypeEnum = new GraphQLEnumType({
    name: `${name}_GeoJSONType`,
    description: 'Enumeration of all GeoJSON object types.',
    values: {
      Point: { value: 'Point' },
      MultiPoint: { value: 'MultiPoint' },
      LineString: { value: 'LineString' },
      MultiLineString: { value: 'MultiLineString' },
      Polygon: { value: 'Polygon' },
      MultiPolygon: { value: 'MultiPolygon' },
      GeometryCollection: { value: 'GeometryCollection' },
      Feature: { value: 'Feature' },
      FeatureCollection: { value: 'FeatureCollection' }
    }
  });

  const CoordinatesScalar = new GraphQLScalarType({
    name: `${name}_GeoJSONCoordinates`,
    description: 'A (multidimensional) set of coordinates following x, y, z order.',
    serialize: value => value,
    parseValue: value => value,
    parseLiteral: valueAST => valueAST.value
  });

  const GeometryObject = new GraphQLObjectType({
    name: `${name}_GeoJSONGeometry`,
    description: 'Object describing a single shape formed by a set of geographical points.',
    // interfaces: () => [GeoJSON.GeoJSONInterface, GeoJSON.GeometryInterface],
    fields: () => ({
      type: { type: new GraphQLNonNull(TypeEnum) },
      // crs: { type: new NonNull(GeoJSON.CoordinateReferenceSystemObject) },
      bbox: { type: new GraphQLList(GraphQLFloat) },
      coordinates: { type: CoordinatesScalar }
    })
  });

  return {
    TypeEnum,
    CoordinatesScalar,
    GeometryObject
  };
};

export default GeoJSON;
