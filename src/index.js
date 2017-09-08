import GeoJSON from './types/geojson';

const pgPostgisPlugin = (builder) => {
  builder.hook('GraphQLObjectType:fields', (fields, buildObject, context) => {
    const {
      extend,
      pgInflection,
      pgIntrospectionResultsByKind,
      pgSql: sql,
      graphql,
      getAliasFromResolveInfo
    } = buildObject;

    const {
      scope: { isPgRowType, isPgCompoundType, pgIntrospection: table },
      fieldWithHooks
    } = context;

    // Get all attributes that have the Postgres 'geometry' type
    const attributes = pgIntrospectionResultsByKind.attribute.filter(f => f.type.name === 'geometry');

    // Do not do anything for tables that don't have one of the above attributes
    if (
      !(isPgRowType || isPgCompoundType) ||
      !table ||
      table.kind !== 'class' ||
      !attributes.map(a => a.class.id).includes(table.id)
    ) {
      return fields;
    }

    return extend(fields,
      attributes
        .filter(attr => attr.classId === table.id)
        .reduce((memo, attr) => {
            /*
            attr =
              { kind: 'attribute',
                classId: '6546809',
                num: 21,
                name: 'upstreamName',
                description: null,
                typeId: '6484393',
                isNotNull: false,
                hasDefault: false }
            */
          const fieldName = pgInflection.column(
            attr.name,
            table.name,
            table.namespace && table.namespace.name
          );

          memo[`${fieldName}As`] = fieldWithHooks(`${fieldName}As`, ({ addDataGenerator }) => {
            addDataGenerator(parsedResolveInfoFragment => {
              // args.as will be ST_AsGeoJSON, ST_AsText...
              const { alias, args } = parsedResolveInfoFragment;
              return {
                pgQuery: queryBuilder => {
                  queryBuilder.select(
                    // TODO sql.identifier('ST_AsGeoJSON') yields error: "function ST_AsGeoJSON(geometry) does not exist"
                    // sql.fragment`${sql.identifier(args.as)}(${sql.identifier(attribute.name)})`,
                    sql.fragment`ST_AsGeoJSON(${sql.identifier(attr.name)})`,
                    alias
                  );
                }
              };
            });

            return {
              type: GeoJSON(graphql, attr.name).GeometryObject,
              args: {
                as: {
                  type: new graphql.GraphQLEnumType({
                    name: `${attr.name}As`,
                    description: 'Get the Polygon geometry as different output type',
                    values: {
                      GeoJSON: { value: 'ST_AsGeoJSON' }
                      // Add support for ST_AsText, ST_AsGML...
                    }
                  })
                }
              },
              description: attr.description,
              resolve (data, _args, _context, resolveInfo) {
                const alias = getAliasFromResolveInfo(resolveInfo);
                return JSON.parse(data[alias]);
              }
            };
          });
          return memo;
        }, {})
    );
  });
};

export default pgPostgisPlugin;
