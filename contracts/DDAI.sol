import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Token.sol";
import "./DSDAI.sol";

interface YDAI {
    function deposit(uint _amount) external;
    function withdraw(uint _amount) external;
    function balanceOf(address account) external view returns (uint);
    function getPricePerFullShare() external view returns (uint);
}

/*

DDAI is an ERC20 token which facilitates delegated yield farming.
Alice can stake DAI for Bob, and receives DDAI for doing so, which
Bob can use in other applicatoins, for example community membership
or access to services or content.

*/
contract DDAI is ERC20 {

    YDAI ydai = YDAI(address(0xC2cB1040220768554cf699b0d863A3cd4324ce32));
    Token dai = Token(address(0x6B175474E89094C44Da98b954EedeAC495271d0F));
    uint256 public minimumStake;
    address public beneficiary;

    constructor(uint initialSupply, address _beneficiary) public ERC20("dsDAI", "dsDAI") {
        // mint 1MM tokens so that we don't need to mint tokens often
        // should be fine in most cases, but can make adjustable in the future
        _mint(address(this), initialSupply);

        minimumStake = 10; // must stake at least 10 DAI (handle conversions)
        beneficiary = _beneficiary;
    }

    function deposit(uint amount) public {
        require(amount >= minimumStake, 'Deposit less than minimum stake');

        // transfer dai to me
        dai.transferFrom(msg.sender, address(this), amount);
        // give you ddai
        this.transfer(msg.sender, amount);
        // deposit in yearn
        dai.approve(address(ydai), amount);
        ydai.deposit(amount);
    }

    function withdraw() public returns (uint) {
        // send back ALL ddai
        uint ddai0 = balanceOf(msg.sender);
        this.transferFrom(msg.sender, address(this), balanceOf(msg.sender));
        
        // how much dai do we have in yearn?
        uint price = ydai.getPricePerFullShare();
        uint balanceShares = ydai.balanceOf(address(this));
        uint value = price * balanceShares / 1e18;

        // withdraw from yearn pool into dai
        ydai.withdraw(balanceShares);

        // send dai to A and B
        // uint harvest = ; // dai received from yearn
        dai.transfer(msg.sender, dai.balanceOf(address(this)));
        
        // IF extra, then send to {beneficiary}
        if (value > ddai0) {
            dai.transfer(beneficiary, value - ddai0);
        }
        
        // how much did we harvest?
        return value;
    }


    
}