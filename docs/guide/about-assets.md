# About assets

When discussing assets, we think of different things of value. The simplest explanation relates to the items you hold in your physical wallet. It usually stores some cash in banknotes and coins, but also a bunch of other things. These other things like ID, driving license, social security card etc. represent unique assets.

These unique assets are by definition one-of-a-kind, unrepeatable, undividable objects that represent a valuable information such as identity, licenses, certificates, etc.

Within the realm of the blockchain and other distributed platforms, these assets are represented by non-fungible tokens (NFTs). The Ethereum community has reached a consensus and adopted the [ERC-721](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md) standard to define and serve as an interface for non-fungible tokens on the Ethereum blockchain, and recently also on other platforms.

## Concept ovrview

A ledger represents a folder with the assets of a specific issuer and related owners. Only users authorized by the ledger owner are allowed to manage the ledger. Depending on its configuration, authorized persons can handle the ledger and thus create and manage its assets.

An asset is defined in the form of a specifically designed [JSON](https://en.wikipedia.org/wiki/JSON) object, which conforms to the [RFC-7159](https://en.wikipedia.org/wiki/JSON) and follows the mapping format defined by the [JSON Schema](http://json-schema.org/) specification. This schema represents data conventions and the structure of asset data.

Therefore, within the 0xcert Framework, every asset is structured based on a certain schema. Some data of such block can be public, other data can be private. Asset data objects are stored in a centralized or decentralized database. The original data is always known to both the issuer and the owner of the asset, and the issuer is the one that creates an asset.

Every asset is stored on the platform as an ERC-721 non-fungible token. The 0xcert Framework, however, includes an additional set of functions for managing the ledger and its assets which are not included in the ERC-721 standard. Every asset is identified by an ID that uniquely describes an asset within a ledger.

Every asset also has its own cryptographical proof. This proof is called an `imprint` and is created from the original asset data object. The imprint is stored together with an asset ID within a non-fungible token. The issuer and the owner can reveal certain data from the block to third parties. Thus, a non-fungible token serves as a publicly available proof that allows for third-party verification of data validity. This concept is further described in the `Certification` section.

Apart from the imprint, every asset includes a URI which points to a publicly available [JSON](https://en.wikipedia.org/wiki/JSON) metadata file with additional public information about the asset. This data are ment for public listing on different online services.

## Certification

TODO 

